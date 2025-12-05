"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UploadModal } from "@/components/notes/upload-modal"
import { Plus, MessageSquare, FileText, Settings } from "lucide-react"

export function QuickActions() {
  const [uploadOpen, setUploadOpen] = useState(false)

  const actions = [
    {
      title: "Upload Note",
      description: "Add new study materials",
      icon: Plus,
      onClick: () => setUploadOpen(true),
      primary: true,
    },
    {
      title: "Start Chat",
      description: "Ask questions about your notes",
      icon: MessageSquare,
      href: "/dashboard/chat",
    },
    {
      title: "View Notes",
      description: "Browse all your materials",
      icon: FileText,
      href: "/dashboard/notes",
    },
    {
      title: "Settings",
      description: "Customize your experience",
      icon: Settings,
      href: "/dashboard/settings",
    },
  ]

  return (
    <>
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {actions.map((action) =>
              action.href ? (
                <Link key={action.title} href={action.href}>
                  <Button
                    variant={action.primary ? "default" : "outline"}
                    className="w-full h-auto py-4 px-4 rounded-xl justify-start gap-3"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        action.primary ? "bg-primary-foreground/20" : "bg-primary/10"
                      }`}
                    >
                      <action.icon className={`h-5 w-5 ${action.primary ? "" : "text-primary"}`} />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">{action.title}</div>
                      <div
                        className={`text-xs ${action.primary ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                      >
                        {action.description}
                      </div>
                    </div>
                  </Button>
                </Link>
              ) : (
                <Button
                  key={action.title}
                  variant={action.primary ? "default" : "outline"}
                  className="w-full h-auto py-4 px-4 rounded-xl justify-start gap-3"
                  onClick={action.onClick}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      action.primary ? "bg-primary-foreground/20" : "bg-primary/10"
                    }`}
                  >
                    <action.icon className={`h-5 w-5 ${action.primary ? "" : "text-primary"}`} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">{action.title}</div>
                    <div
                      className={`text-xs ${action.primary ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                    >
                      {action.description}
                    </div>
                  </div>
                </Button>
              ),
            )}
          </div>
        </CardContent>
      </Card>

      <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} />
    </>
  )
}
