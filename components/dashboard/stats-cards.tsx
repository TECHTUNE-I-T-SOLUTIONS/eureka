"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, MessageSquare, Brain, Clock } from "lucide-react"

interface StatsCardsProps {
  notesCount: number
  chatsCount: number
  chunksCount: number
  recentActivity: string
}

export function StatsCards({ notesCount, chatsCount, chunksCount, recentActivity }: StatsCardsProps) {
  const stats = [
    {
      title: "Total Notes",
      value: notesCount,
      icon: FileText,
      description: "Uploaded study materials",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Conversations",
      value: chatsCount,
      icon: MessageSquare,
      description: "AI chat sessions",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Knowledge Chunks",
      value: chunksCount,
      icon: Brain,
      description: "Processed segments",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Last Active",
      value: recentActivity,
      icon: Clock,
      description: "Your recent activity",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      isText: true,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="glass-card rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={stat.isText ? "text-xl font-bold" : "text-3xl font-bold"}>{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
