import { createClient } from "@/lib/supabase/server"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { NoteCard } from "@/components/notes/note-card"
import { formatDistanceToNow } from "date-fns"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch stats
  const [notesResult, chatsResult, chunksResult, recentNotes] = await Promise.all([
    supabase.from("notes").select("id", { count: "exact" }).eq("user_id", user!.id),
    supabase.from("chats").select("id", { count: "exact" }).eq("user_id", user!.id),
    supabase.from("chunks").select("id", { count: "exact" }),
    supabase.from("notes").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(4),
  ])

  const notesCount = notesResult.count || 0
  const chatsCount = chatsResult.count || 0
  const chunksCount = chunksResult.count || 0

  // Get recent activity
  const lastNote = recentNotes.data?.[0]
  const recentActivity = lastNote
    ? formatDistanceToNow(new Date(lastNote.created_at), { addSuffix: true })
    : "No activity yet"

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Welcome back, {user?.user_metadata?.display_name || user?.email?.split("@")[0]}!
        </h1>
        <p className="text-muted-foreground">Here&apos;s an overview of your study progress</p>
      </div>

      {/* Stats */}
      <StatsCards
        notesCount={notesCount}
        chatsCount={chatsCount}
        chunksCount={chunksCount}
        recentActivity={recentActivity}
      />

      {/* Quick Actions */}
      <QuickActions />

      {/* Recent Notes */}
      {recentNotes.data && recentNotes.data.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Notes</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
            {recentNotes.data.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
