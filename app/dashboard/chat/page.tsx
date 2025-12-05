import { createClient } from "@/lib/supabase/server"
import { ChatPageClient } from "@/components/chat/chat-page-client"

interface ChatPageProps {
  searchParams: Promise<{ note?: string; chat?: string; new?: string }>
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch user's chats
  const { data: chats } = await supabase
    .from("chats")
    .select("*")
    .eq("user_id", user!.id)
    .order("updated_at", { ascending: false })

  // Fetch user's notes for the selector
  const { data: notes } = await supabase
    .from("notes")
    .select("id, title, status")
    .eq("user_id", user!.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })

  return (
    <div className="flex flex-1 overflow-hidden animate-fade-in">
      <ChatPageClient
        initialChats={chats || []}
        notes={notes || []}
        initialNoteId={params.note}
        initialChatId={params.chat}
        userId={user!.id}
        startNew={params.new === "true"}
      />
    </div>
  )
}
