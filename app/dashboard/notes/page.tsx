import { createClient } from "@/lib/supabase/server"
import { NotesListClient } from "@/components/notes/notes-list-client"

export default async function NotesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: notes } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })

  return (
    <div className="flex flex-1 flex-col p-4 lg:p-6 animate-fade-in">
      <NotesListClient initialNotes={notes || []} />
    </div>
  )
}
