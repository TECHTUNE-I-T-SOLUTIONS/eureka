import { createHybridClient } from "@/lib/supabase/mobile-server"
import { NextResponse } from "next/server"
import { uploadToCloudinary, parseDocumentBuffer } from "@/lib/utils/document-parser"
import { chunkText } from "@/lib/utils/chunker"
import { openrouterChat, PAID_MODELS } from "@/lib/ai/openrouter"

export async function POST(request: Request) {
  try {
    const supabase = await createHybridClient(request)
    const { data: { user } } = await supabase.auth.getUser()

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
      content = body.content || ""
      uploadedVia = body.uploadedVia || "text"

      // Handle base64 file sent from mobile
      if (body.file?.base64) {
        try {
          const buffer = Buffer.from(body.file.base64, "base64")
          const fileName = body.file.name || "document.pdf"
          const mimeType = body.file.type || (fileName.endsWith(".pdf") ? "application/pdf" : "text/plain")

          // 1. Upload to Cloudinary
          fileUrl = await uploadToCloudinary(buffer, fileName)

          // 2. Parse document text from buffer
          const extractedText = await parseDocumentBuffer(buffer, fileName, mimeType)
          if (extractedText && extractedText.trim().length > 0) {
            content = extractedText
          }

          if (!title) {
            title = fileName.replace(/\.[^/.]+$/, "")
          }
        } catch (fileErr) {
          console.error("Base64 file processing error:", fileErr)
        }
      }
    }

    if (!title) {
      title = "Untitled Study Note"
    }

    if (!content || content.trim().length === 0) {
      content = `[Empty document content uploaded at ${new Date().toISOString()}]`
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
