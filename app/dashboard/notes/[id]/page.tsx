import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { NoteDetailClient } from "@/components/notes/note-detail-client"

interface NoteDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function NoteDetailPage({ params }: NoteDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/?auth=login")
  }

  const { data: note, error } = await supabase.from("notes").select("*").eq("id", id).eq("user_id", user.id).single()

  if (error || !note) {
    notFound()
  }

  // Fetch chunks for this note
  const { data: chunks } = await supabase
    .from("chunks")
    .select("*")
    .eq("note_id", id)
    .order("chunk_index", { ascending: true })

  return (
    <div className="flex flex-1 flex-col p-4 lg:p-6 animate-fade-in">
      <NoteDetailClient note={note} chunks={chunks || []} />
    </div>
  )
}
