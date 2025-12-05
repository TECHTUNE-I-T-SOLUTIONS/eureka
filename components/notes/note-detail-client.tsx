"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, MessageSquare, Trash2, Calendar, FileText, Layers, Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow, format } from "date-fns"
import type { Note, Chunk } from "@/lib/types"

interface NoteDetailClientProps {
  note: Note
  chunks: Chunk[]
}

export function NoteDetailClient({ note: initialNote, chunks: initialChunks }: NoteDetailClientProps) {
  const [note, setNote] = useState(initialNote)
  const [chunks, setChunks] = useState(initialChunks)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()

  // Subscribe to real-time note updates
  useEffect(() => {
    const supabase = createClient()

    // Subscribe to note changes
    const noteChannel = supabase
      .channel(`note-${initialNote.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notes",
          filter: `id=eq.${initialNote.id}`,
        },
        (payload) => {
          setNote((prev) => ({ ...prev, ...payload.new }))
        }
      )
      .subscribe()

    // Subscribe to chunks changes
    const chunksChannel = supabase
      .channel(`chunks-${initialNote.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chunks",
          filter: `note_id=eq.${initialNote.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setChunks((prev) => [...prev, payload.new])
          } else if (payload.eventType === "UPDATE") {
            setChunks((prev) =>
              prev.map((chunk) =>
                chunk.id === payload.new.id ? { ...chunk, ...payload.new } : chunk
              )
            )
          } else if (payload.eventType === "DELETE") {
            setChunks((prev) => prev.filter((chunk) => chunk.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(noteChannel)
      supabase.removeChannel(chunksChannel)
    }
  }, [initialNote.id])

  const handleDelete = async () => {
    setIsDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from("notes").delete().eq("id", note.id)

    if (error) {
      toast.error("Failed to delete note")
      setIsDeleting(false)
    } else {
      toast.success("Note deleted")
      router.push("/dashboard/notes")
    }
  }

  const handleReprocess = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch("/api/notes/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId: note.id }),
      })

      if (!response.ok) throw new Error("Processing failed")

      toast.success("Note reprocessing started")
      router.refresh()
    } catch {
      toast.error("Failed to reprocess note")
    } finally {
      setIsProcessing(false)
    }
  }

  const statusColors = {
    pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    processing: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    completed: "bg-green-500/10 text-green-600 dark:text-green-400",
    error: "bg-red-500/10 text-red-600 dark:text-red-400",
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0 rounded-xl">
            <Link href="/dashboard/notes">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{note.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className={statusColors[note.status as keyof typeof statusColors]}>
                {note.status}
              </Badge>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(note.created_at), "MMM d, yyyy")}
              </span>
              <span>Updated {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild className="rounded-xl gap-2 bg-transparent">
            <Link href={`/dashboard/chat?note=${note.id}`}>
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Chat with Note</span>
              <span className="sm:hidden">Chat</span>
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="rounded-xl text-destructive hover:text-destructive bg-transparent">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Note</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &quot;{note.title}&quot;? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs defaultValue="content" className="space-y-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="content" className="rounded-lg gap-2">
            <FileText className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="summary" className="rounded-lg gap-2">
            <Sparkles className="h-4 w-4" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="chunks" className="rounded-lg gap-2">
            <Layers className="h-4 w-4" />
            Chunks ({chunks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          <Card className="glass-card rounded-2xl">
            <CardHeader>
              <CardTitle>Original Content</CardTitle>
              <CardDescription>The raw text of your uploaded note</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] rounded-xl border bg-muted/30 p-4">
                <pre className="whitespace-pre-wrap font-mono text-sm">{note.raw_text}</pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card className="glass-card rounded-2xl">
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>AI Summary</CardTitle>
                <CardDescription>An AI-generated summary of your note</CardDescription>
              </div>
              {note.status !== "processing" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReprocess}
                  disabled={isProcessing}
                  className="rounded-xl bg-transparent"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Regenerate
                    </>
                  )}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {note.summary ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-foreground leading-relaxed">{note.summary}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Sparkles className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    {note.status === "processing" ? "Summary is being generated..." : "No summary available yet"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chunks">
          <Card className="glass-card rounded-2xl">
            <CardHeader>
              <CardTitle>Text Chunks</CardTitle>
              <CardDescription>Your note has been split into {chunks.length} searchable segments</CardDescription>
            </CardHeader>
            <CardContent>
              {chunks.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {chunks.map((chunk, index) => (
                      <div
                        key={chunk.id}
                        className="rounded-xl border bg-muted/30 p-4 transition-colors hover:bg-muted/50"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <Badge variant="outline">Chunk {index + 1}</Badge>
                          <span className="text-xs text-muted-foreground">{chunk.chunk_text.length} characters</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3">{chunk.chunk_text}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Layers className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    {note.status === "processing" ? "Chunks are being created..." : "No chunks available"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
