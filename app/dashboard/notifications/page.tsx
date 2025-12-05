import { createClient } from "@/lib/supabase/server"
import { NotificationsClient } from "@/components/notifications/notifications-client"

export default async function NotificationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div className="flex flex-1 flex-col p-4 lg:p-6 animate-fade-in">
      <NotificationsClient initialNotifications={notifications || []} />
    </div>
  )
}
