import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch all user data
    const [notesResult, chatsResult, messagesResult, settingsResult, notificationsResult] = await Promise.all([
      supabase.from("notes").select("*").eq("user_id", user.id),
      supabase.from("chats").select("*").eq("user_id", user.id),
      supabase.from("chat_messages").select("*, chats!inner(user_id)").eq("chats.user_id", user.id),
      supabase.from("user_settings").select("*").eq("id", user.id).single(),
      supabase.from("notifications").select("*").eq("user_id", user.id),
    ])

    const exportData = {
      exported_at: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      settings: settingsResult.data,
      notes: notesResult.data || [],
      chats: chatsResult.data || [],
      messages: messagesResult.data || [],
      notifications: notificationsResult.data || [],
    }

    return NextResponse.json(exportData)
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Export failed" }, { status: 500 })
  }
}
