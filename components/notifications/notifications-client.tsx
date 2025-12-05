"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Check, CheckCheck, Trash2, FileText, AlertCircle, Info } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import type { Notification } from "@/lib/types"
import Link from "next/link"

interface NotificationsClientProps {
  initialNotifications: Notification[]
}

const iconMap = {
  note_ready: FileText,
  chunks_processed: FileText,
  system: AlertCircle,
  info: Info,
}

const colorMap = {
  note_ready: "text-green-500",
  chunks_processed: "text-blue-500",
  system: "text-orange-500",
  info: "text-primary",
}

export function NotificationsClient({ initialNotifications }: NotificationsClientProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [isLoading, setIsLoading] = useState(false)

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const markAsRead = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id)

    if (!error) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    }
  }

  const markAllAsRead = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("is_read", false)

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      toast.success("All notifications marked as read")
    } else {
      toast.error("Failed to mark notifications as read")
    }
    setIsLoading(false)
  }

  const deleteNotification = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("notifications").delete().eq("id", id)

    if (!error) {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      toast.success("Notification deleted")
    } else {
      toast.error("Failed to delete notification")
    }
  }

  const clearAll = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from("notifications").delete().neq("id", "00000000-0000-0000-0000-000000000000") // Delete all

    if (!error) {
      setNotifications([])
      toast.success("All notifications cleared")
    } else {
      toast.error("Failed to clear notifications")
    }
    setIsLoading(false)
  }

  const getNotificationLink = (notification: Notification) => {
    const payload = notification.payload as Record<string, unknown>
    if (payload?.note_id) return `/dashboard/notes/${payload.note_id}`
    if (payload?.chat_id) return `/dashboard/chat?chat=${payload.chat_id}`
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "You're all caught up!"}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={markAllAsRead}
              disabled={isLoading}
              className="rounded-xl bg-transparent"
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="outline"
              onClick={clearAll}
              disabled={isLoading}
              className="rounded-xl text-destructive hover:text-destructive bg-transparent"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear all
            </Button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card className="glass-card rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No notifications</h3>
            <p className="mt-1 text-sm text-muted-foreground text-center max-w-sm">
              When you upload notes, chat, or complete tasks, notifications will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-card rounded-2xl">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = iconMap[notification.type as keyof typeof iconMap] || Info
                const iconColor = colorMap[notification.type as keyof typeof colorMap] || "text-primary"
                const link = getNotificationLink(notification)

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex items-start gap-4 p-4 transition-colors hover:bg-muted/50",
                      !notification.is_read && "bg-primary/5",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted",
                        iconColor,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {link ? (
                            <Link
                              href={link}
                              className="font-medium hover:underline"
                              onClick={() => markAsRead(notification.id)}
                            >
                              {notification.title}
                            </Link>
                          ) : (
                            <p className="font-medium">{notification.title}</p>
                          )}
                          <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.is_read && (
                            <Badge variant="secondary" className="h-5 text-xs">
                              New
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => !notification.is_read && markAsRead(notification.id)}
                            disabled={notification.is_read}
                          >
                            <Check className="h-4 w-4" />
                            <span className="sr-only">Mark as read</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  )
}
