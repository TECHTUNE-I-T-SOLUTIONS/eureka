"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { MoreHorizontal, FileText, MessageSquare, Trash2, Loader2, CheckCircle2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Note } from "@/lib/types"
import { cn } from "@/lib/utils"

interface NoteCardProps {
  note: Note
  onDelete?: (noteId: string) => void
}

export function NoteCard({ note, onDelete }: NoteCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [displayNote, setDisplayNote] = useState(note)
  const [lastStatus, setLastStatus] = useState(note.status)
  const router = useRouter()

  // Update display note when prop changes
  useEffect(() => {
    setDisplayNote(note)
    
    // Show toast when status changes to completed
    if (lastStatus !== note.status && note.status === "completed") {
      toast.success("Note processed!", {
        description: `"${note.title}" is ready for studying.`,
        icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
      })
    }
    
    setLastStatus(note.status)
  }, [note, lastStatus])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("notes").delete().eq("id", note.id)

      if (error) throw error

      toast.success("Note deleted")
      onDelete?.(note.id)
      router.refresh()
    } catch (error) {
      toast.error("Failed to delete note")
    } finally {
      setIsDeleting(false)
    }
  }

  const statusColors = {
    pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    processing: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    completed: "bg-green-500/10 text-green-600 dark:text-green-400",
    error: "bg-red-500/10 text-red-600 dark:text-red-400",
  }

  return (
    <Card className="glass-card rounded-2xl transition-all hover:shadow-xl hover:scale-[1.02] group">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1 flex-1 min-w-0">
          <CardTitle className="text-lg font-semibold line-clamp-1">{displayNote.title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={cn("text-xs", statusColors[displayNote.status as keyof typeof statusColors])}
            >
              {displayNote.status === "processing" && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              {displayNote.status === "completed" && <CheckCircle2 className="mr-1 h-3 w-3 text-green-600" />}
              {displayNote.status.charAt(0).toUpperCase() + displayNote.status.slice(1)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(displayNote.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/notes/${displayNote.id}`} className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                View Note
              </Link>
            </DropdownMenuItem>
            {displayNote.status === "completed" && (
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/chat?note=${displayNote.id}`} className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chat about this
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 text-destructive focus:text-destructive"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">{displayNote.summary || displayNote.raw_text.slice(0, 200)}</p>
      </CardContent>
    </Card>
  )
}
