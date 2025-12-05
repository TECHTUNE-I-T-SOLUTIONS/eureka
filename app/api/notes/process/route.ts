import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { chunkText } from "@/lib/utils/chunker"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY)

export async function POST(request: Request) {
  try {
    const { noteId } = await request.json()

    if (!noteId) {
      return NextResponse.json({ error: "Note ID required" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the note
    const { data: note, error: noteError } = await supabase
      .from("notes")
      .select("*")
      .eq("id", noteId)
      .eq("user_id", user.id)
      .single()

    if (noteError || !note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    // Update status to processing
    await supabase.from("notes").update({ status: "processing" }).eq("id", noteId)

    try {
      // Chunk the text
      const chunks = chunkText(noteId, note.raw_text)

      // Delete existing chunks
      await supabase.from("chunks").delete().eq("note_id", noteId)

      // Insert new chunks
      if (chunks.length > 0) {
        const { error: chunkError } = await supabase.from("chunks").insert(
          chunks.map((chunk) => ({
            note_id: noteId,
            chunk_index: chunk.index,
            chunk_text: chunk.text,
            chunk_hash: chunk.hash,
            embedding: null,
          })),
        )

        if (chunkError) throw chunkError
      }

      // Generate summary using Gemini 2.0 Flash
      let summary = null
      try {
        // Check if we have actual content to summarize
        if (!note.raw_text || note.raw_text.trim().length === 0) {
          console.warn("Note has no content, skipping AI summary")
          summary = "[No content to summarize - please re-upload with file content]"
        } else {
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
          const result = await model.generateContent(
            `Summarize the following study notes in 2-3 paragraphs. Focus on the key concepts and main ideas. You can search the internet if needed to provide better context:\n\n${note.raw_text.slice(0, 8000)}`
          )
          summary = result.response.text()
        }
      } catch (aiError) {
        console.error("AI summary failed:", aiError)
        summary = note.raw_text && note.raw_text.length > 0 
          ? note.raw_text.slice(0, 200) + "..." 
          : "[Failed to generate summary - no content available]"
      }

      // Update note status and summary
      await supabase
        .from("notes")
        .update({
          status: "completed",
          summary,
        })
        .eq("id", noteId)

      // Send push notification immediately (only if subscriptions exist)
      try {
        const { data: subscriptions } = await supabase
          .from("push_subscriptions")
          .select("*")
          .eq("user_id", user.id)

        if (subscriptions && subscriptions.length > 0) {
          const webpush = await import("web-push")
          webpush.setVapidDetails(
            process.env.PUSH_NOTIFICATIONS_SUBJECT || "",
            process.env.PUSH_NOTIFICATIONS_PUBLIC_KEY || "",
            process.env.PUSH_NOTIFICATIONS_PRIVATE_KEY || ""
          )

          for (const sub of subscriptions) {
            try {
              // Validate subscription has required fields
              if (!sub.endpoint || !sub.p256dh || !sub.auth) {
                console.warn("Push subscription missing required fields, skipping")
                continue
              }

              await webpush.sendNotification(
                {
                  endpoint: sub.endpoint,
                  keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth,
                  },
                },
                JSON.stringify({
                  title: "Notes Ready!",
                  body: `"${note.title}" has been processed and is ready for studying.`,
                  icon: "/Eureka-01.png",
                  badge: "/favicon-32x32.png",
                  tag: `note-${noteId}`,
                  data: {
                    noteId,
                  },
                })
              )
              console.log("Push notification sent successfully")
            } catch (pushError) {
              console.error("Push notification failed:", pushError)
            }
          }
        } else {
          console.log("No push subscriptions found for user - skipping push notifications")
        }
      } catch (pushError) {
        console.error("Push setup failed:", pushError)
      }

      // Create in-app notification
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "chunks_processed",
        title: "Notes Ready!",
        message: `"${note.title}" has been processed and is ready for studying.`,
        payload: { note_id: noteId, chunk_count: chunks.length },
      })

      return NextResponse.json({
        success: true,
        chunkCount: chunks.length,
        summary,
      })
    } catch (processingError) {
      // Update status to error
      await supabase.from("notes").update({ status: "error" }).eq("id", noteId)

      throw processingError
    }
  } catch (error) {
    console.error("Processing error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Processing failed" }, { status: 500 })
  }
}
