import { createHybridClient } from "@/lib/supabase/mobile-server"
import { NextResponse } from "next/server"
import { chunkText } from "@/lib/utils/chunker"
import { openrouterChat, PAID_MODELS } from "@/lib/ai/openrouter"

// Simple in-memory rate limiter
const requestQueue: { resolve: (v: any) => void; reject: (e: any) => void; fn: () => Promise<string | null> }[] = []
let isProcessing = false
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 2000

async function processQueue() {
  if (isProcessing || requestQueue.length === 0) return

  isProcessing = true

  while (requestQueue.length > 0) {
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime

    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest
      await new Promise((resolve) => setTimeout(resolve, waitTime))
    }

    const item = requestQueue.shift()
    if (item) {
      try {
        const result = await item.fn()
        item.resolve(result)
      } catch (error) {
        item.reject(error)
      }
      lastRequestTime = Date.now()
    }
  }

  isProcessing = false
}

async function queuedGenerateContent(model: any, prompt: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    requestQueue.push({
      fn: async () => {
        try {
          const result = await model.generateContent(prompt)
          return result.response.text()
        } catch (error: any) {
          const errorMessage = error?.message || JSON.stringify(error)
          const statusCode = error?.status || error?.statusCode

          const is429 =
            statusCode === 429 ||
            errorMessage.includes("429") ||
            errorMessage.includes("Too Many Requests") ||
            errorMessage.includes("quota") ||
            errorMessage.includes("Quota exceeded") ||
            errorMessage.includes("rate limit") ||
            errorMessage.includes("RESOURCE_EXHAUSTED")

          if (is429) {
            console.error("Quota exceeded - free tier limit reached")
            return null
          }
          throw error
        }
      },
      resolve,
      reject,
    })

    processQueue()
  })
}

export async function POST(request: Request) {
  try {
    const { noteId } = await request.json()

    if (!noteId) {
      return NextResponse.json({ error: "Note ID required" }, { status: 400 })
    }

    const supabase = await createHybridClient(request)
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

      // Generate summary using Gemini 2.0 Flash-Lite
      let summary = null
      try {
        if (!note.raw_text || note.raw_text.trim().length === 0) {
          console.warn("Note has no content, skipping AI summary")
          summary = "[No content to summarize - please re-upload with file content]"
        } else {
          try {
            const result = await openrouterChat({
              messages: [
                { role: "system", content: "You are an expert study assistant. Summarize the following study notes in 2-3 paragraphs. Focus on the key concepts and main ideas. You can search the internet if needed to provide better context:" },
                { role: "user", content: note.raw_text.slice(0, 8000) },
              ],
              modelList: PAID_MODELS,
              temperature: 0.5,
              max_tokens: 1024,
            })
            summary = result.content
          } catch (err) {
            summary = "[Failed to generate summary - all AI models failed or are at capacity]"
          }
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
