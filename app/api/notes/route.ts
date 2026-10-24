import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { uploadToCloudinary, parseDocumentBuffer } from "@/lib/utils/document-parser"

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

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const user = await getAuthUser(request, supabase)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: notes, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(notes)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
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
    let uploadedVia = "text"
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

          // 1. Upload document binary to Cloudinary
          fileUrl = await uploadToCloudinary(buffer, fileName)

          // 2. Real server-side parsing (PDF text extraction, TXT, MD)
          const extractedText = await parseDocumentBuffer(buffer, fileName, mimeType)
          if (extractedText && extractedText.trim().length > 0) {
            content = extractedText
          }

          if (!title) {
            title = fileName.replace(/\.[^/.]+$/, "")
          }
        } catch (fileErr) {
          console.error("File processing error in /api/notes:", fileErr)
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
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    if (fileUrl) {
      content = `${content}\n\n[Cloudinary File Source: ${fileUrl}]`
    }

    const { data: note, error } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        title,
        raw_text: content,
        uploaded_via: uploadedVia || "text",
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(note)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const noteId = searchParams.get("id")

    if (!noteId) {
      return NextResponse.json({ error: "Note ID is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const user = await getAuthUser(request, supabase)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase.from("notes").delete().eq("id", noteId).eq("user_id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Note deleted" })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
