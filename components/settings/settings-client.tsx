"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { User, Bell, BookOpen, Download, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import type { UserSettings } from "@/lib/types"

interface SettingsClientProps {
  user: SupabaseUser
  initialSettings: UserSettings | null
}

export function SettingsClient({ user, initialSettings }: SettingsClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isPushLoading, setIsPushLoading] = useState(false)
  const [settings, setSettings] = useState({
    display_name: initialSettings?.display_name || user.user_metadata?.display_name || "",
    explain_level: initialSettings?.explain_level || "intermediate",
    notify_on_new_chunks: initialSettings?.notify_on_new_chunks ?? true,
    push_enabled: initialSettings?.push_enabled ?? false,
    email_notifications: initialSettings?.email_notifications ?? false,
  })

  const subscribeToPushNotifications = useCallback(async () => {
    setIsPushLoading(true)
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Push notifications are not supported in this browser")
      }

      // Register service worker with error handling
      let registration
      try {
        registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" })
      } catch (swError) {
        console.error("Service worker registration failed:", swError)
        throw new Error("Failed to register service worker. Please ensure /sw.js is accessible.")
      }

      // Request permission
      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission()
        if (permission !== "granted") {
          throw new Error("Notification permission denied")
        }
      } else if (Notification.permission === "denied") {
        throw new Error("Notification permission is denied. Please enable it in your browser settings.")
      }

      // Get or create subscription
      let subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!publicKey) {
          throw new Error("Push service not configured")
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        })
      }

      // Validate subscription has required fields
      if (!subscription.endpoint || !subscription.toJSON().keys?.p256dh || !subscription.toJSON().keys?.auth) {
        throw new Error("Invalid subscription data - missing required fields")
      }

      // Send subscription to backend
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to register subscription")
      }

      toast.success("Push notifications enabled successfully")
      setSettings((s) => ({ ...s, push_enabled: true }))
    } catch (error) {
      console.error("Push notification error:", error)
      toast.error("Failed to enable push notifications", {
        description: error instanceof Error ? error.message : "An error occurred",
      })
      // Reset toggle on error
      setSettings((s) => ({ ...s, push_enabled: false }))
    } finally {
      setIsPushLoading(false)
    }
  }, [])

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      await subscribeToPushNotifications()
    }
    setSettings((s) => ({ ...s, push_enabled: enabled }))
  }

  const handleSave = async () => {
    setIsLoading(true)

    try {
      const supabase = createClient()

      // Update user settings
      const { error } = await supabase.from("user_settings").upsert({
        id: user.id,
        ...settings,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      // Update auth metadata
      await supabase.auth.updateUser({
        data: { display_name: settings.display_name },
      })

      toast.success("Settings saved successfully")
      router.refresh()
    } catch (error) {
      toast.error("Failed to save settings", {
        description: error instanceof Error ? error.message : "An error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)

    try {
      const response = await fetch("/api/export")
      if (!response.ok) throw new Error("Export failed")

      const data = await response.json()

      // Create and download file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `eureka-export-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("Data exported successfully")
    } catch {
      toast.error("Failed to export data")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Profile Settings */}
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle>Profile</CardTitle>
          </div>
          <CardDescription>Your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              value={settings.display_name}
              onChange={(e) => setSettings((s) => ({ ...s, display_name: e.target.value }))}
              placeholder="Your name"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user.email || ""} disabled className="rounded-xl bg-muted" />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>
        </CardContent>
      </Card>

      {/* Learning Preferences */}
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle>Learning Preferences</CardTitle>
          </div>
          <CardDescription>Customize how Eureka explains things to you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="explain_level">Explanation Level</Label>
            <Select
              value={settings.explain_level}
              onValueChange={(v) => setSettings((s) => ({ ...s, explain_level: v }))}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner - Simple explanations</SelectItem>
                <SelectItem value="intermediate">Intermediate - Balanced detail</SelectItem>
                <SelectItem value="advanced">Advanced - Technical depth</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">This affects how the AI explains concepts to you</p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>Control how you receive updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Processing Notifications</Label>
              <p className="text-sm text-muted-foreground">Get notified when notes are processed</p>
            </div>
            <Switch
              checked={settings.notify_on_new_chunks}
              onCheckedChange={(v) => setSettings((s) => ({ ...s, notify_on_new_chunks: v }))}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
            </div>
            <Switch
              checked={settings.push_enabled}
              onCheckedChange={handlePushToggle}
              disabled={isPushLoading}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive email updates</p>
            </div>
            <Switch
              checked={settings.email_notifications}
              onCheckedChange={(v) => setSettings((s) => ({ ...s, email_notifications: v }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <CardTitle>Data Export</CardTitle>
          </div>
          <CardDescription>Download all your data</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleExport} disabled={isExporting} className="rounded-xl bg-transparent">
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export All Data
              </>
            )}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">Download your notes, chats, and settings as a JSON file</p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading} className="rounded-xl gap-2">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>
    </div>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}
