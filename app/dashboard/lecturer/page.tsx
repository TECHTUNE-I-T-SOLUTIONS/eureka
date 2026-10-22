import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LecturerClient } from "@/components/lecturer/lecturer-client"

export const metadata: Metadata = {
  title: "Lecturer Mode - Eureka",
  description: "Interactive AI lecturer with live audio explanations",
}

export default async function LecturerPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/?auth=login")
  }

  // Get user's notes for selection
  const { data: notes } = await supabase
    .from("notes")
    .select("id, title, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Get user settings
  const { data: settings } = await supabase
    .from("user_settings")
    .select("explain_level")
    .eq("id", user.id)
    .single()

  return (
    <div className="h-full">
      <LecturerClient
        notes={notes || []}
        initialExplanationLevel={settings?.explain_level || "intermediate"}
      />
    </div>
  )
}
