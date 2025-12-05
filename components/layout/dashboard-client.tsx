"use client"

import { usePushNotifications } from "@/hooks/use-push-notifications"

export function DashboardClient({ children }: { children: React.ReactNode }) {
  usePushNotifications()
  return <>{children}</>
}
