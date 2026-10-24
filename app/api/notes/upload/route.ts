import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { uploadToCloudinary, parseDocumentBuffer } from "@/lib/utils/document-parser"
import { chunkText } from "@/lib/utils/chunker"
import { openrouterChat, PAID_MODELS } from "@/lib/ai/openrouter"

async function getAuthUser(request: Request, supabase: any) {
  const authHeader = request.headers.get("authorization")
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.substring(7).trim()
    if (token) {
      const { data: { user }, error } = await supabase.auth.getUser(token)
      if (user && !error) return user
    }
  }
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const user = await getAuthUser(request, supabase)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const contentType = request.headers.get("content-type") || ""

    let title = ""
    let content = ""
    let uploadedVia = "file"
    let fileUrl: string | null = null

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      title = (formData.get("title") as string) || ""
      uploadedVia = (formData.get("uploadedVia") as string) || "file"
      const contentField = formData.get("content") as string | null
      const file = formData.get("file") as File | null

      if (contentField) {
        content = contentField
      }

      if (file && typeof file === "object" && "arrayBuffer" in file) {
        try {
          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const fileName = file.name || "document"
          const mimeType = file.type || ""

          // 1. Upload to Cloudinary
          fileUrl = await uploadToCloudinary(buffer, fileName)

          // 2. Parse document text
          const extractedText = await parseDocumentBuffer(buffer, fileName, mimeType)
          if (extractedText && extractedText.trim().length > 0) {
            content = extractedText
          }

          if (!title) {
            title = fileName.replace(/\.[^/.]+$/, "")
          }
        } catch (fileErr) {
          console.error("File processing error:", fileErr)
        }
      }
    } else {
      const body = await request.json()
      title = body.title
      content = body.content
      uploadedVia = body.uploadedVia || "text"
    }

    if (!title) {
      title = "Untitled Study Note"
    }

    if (!content || content.trim().length === 0) {
      content = `[Empty document content uploaded at ${new Date().toISOString()}]`
    }

    if (fileUrl) {
      content = `${content}\n\n[Cloudinary File Source: ${fileUrl}]`
    }

    // 3. Save note to Supabase with status 'processing'
    const { data: note, error: insertError } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        title,
        raw_text: content,
        uploaded_via: uploadedVia,
        status: "processing",
      })
      .select()
      .single()

    if (insertError || !note) {
      return NextResponse.json({ error: insertError?.message || "Failed to create note" }, { status: 500 })
    }

    // 4. Perform Chunking and AI Analysis (Summary & Key Points)
    try {
      const chunks = chunkText(note.id, content)
      await supabase.from("chunks").delete().eq("note_id", note.id)

      if (chunks.length > 0) {
        await supabase.from("chunks").insert(
          chunks.map((chunk) => ({
            note_id: note.id,
            chunk_index: chunk.index,
            chunk_text: chunk.text,
            chunk_hash: chunk.hash,
            embedding: null,
          }))
        )
      }

      // Generate AI Summary & Key Points
      let summary = ""
      try {
        const aiPrompt = `You are an expert educational AI assistant. Analyze the following document text and produce a comprehensive study summary with key concepts and main takeaways:

Title: ${title}
Content:
${content.slice(0, 8000)}`

        const aiResult = await openrouterChat({
          messages: [
            {
              role: "system",
              content: "You are an expert study assistant. Provide clear, structured summaries with bullet points for key concepts.",
            },
            { role: "user", content: aiPrompt },
          ],
          modelList: PAID_MODELS,
          temperature: 0.5,
          max_tokens: 1500,
        })
        summary = aiResult.content
      } catch (aiErr) {
        console.error("AI summary generation error:", aiErr)
        summary = content.slice(0, 300) + "..."
      }

      // 5. Update note status to completed
      const { data: updatedNote } = await supabase
        .from("notes")
        .update({
          status: "completed",
          summary,
        })
        .eq("id", note.id)
        .select()
        .single()

      // Create notification
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "chunks_processed",
        title: "Notes Ready!",
        message: `"${title}" has been parsed, uploaded, and summarized.`,
        payload: { note_id: note.id, chunk_count: chunks.length },
      })

      return NextResponse.json(updatedNote || { ...note, status: "completed", summary })
    } catch (procErr) {
      console.error("Processing error during upload:", procErr)
      await supabase.from("notes").update({ status: "completed" }).eq("id", note.id)
      return NextResponse.json({ ...note, status: "completed" })
    }
  } catch (error) {
    console.error("Upload route error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
