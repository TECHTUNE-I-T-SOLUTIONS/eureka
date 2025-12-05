import { createClient } from "@/lib/supabase/server"
import { SettingsClient } from "@/components/settings/settings-client"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: settings } = await supabase.from("user_settings").select("*").eq("id", user!.id).single()

  return (
    <div className="flex flex-1 flex-col p-4 lg:p-6 animate-fade-in">
      <div className="mx-auto w-full max-w-2xl">
        <SettingsClient user={user!} initialSettings={settings} />
      </div>
    </div>
  )
}
