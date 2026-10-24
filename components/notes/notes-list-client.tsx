"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NoteCard } from "@/components/notes/note-card"
import { UploadModal } from "@/components/notes/upload-modal"
import { Plus, Search, FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { Note } from "@/lib/types"

interface NotesListClientProps {
  initialNotes: Note[]
}

export function NotesListClient({ initialNotes }: NotesListClientProps) {
  const [notes, setNotes] = useState(initialNotes)
  const [searchQuery, setSearchQuery] = useState("")
  const [uploadOpen, setUploadOpen] = useState(false)
  const searchParams = useSearchParams()

  // Check if upload modal should be open from URL
  useEffect(() => {
    if (searchParams.get("upload") === "true") {
      setUploadOpen(true)
    }
  }, [searchParams])

  // Subscribe to real-time note updates
  useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase
      .channel("notes-changes", { 
        config: { presence: { key: "notes-list" } } 
      })
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notes",
        },
        (payload) => {
          const newNote = payload.new as Note | undefined
          const oldNote = payload.old as { id: string } | undefined
          console.log("[Notes List] Real-time update:", payload.eventType, newNote?.id)
          
          if (payload.eventType === "UPDATE" && newNote) {
            setNotes((prev) =>
              prev.map((note) =>
                note.id === newNote.id
                  ? { ...note, ...newNote }
                  : note
              )
            )
          } else if (payload.eventType === "INSERT" && newNote) {
            // Don't add duplicate if already exists
            setNotes((prev) => {
              const exists = prev.some((n) => n.id === newNote.id)
              return exists ? prev : [newNote, ...prev]
            })
          } else if (payload.eventType === "DELETE" && oldNote) {
            setNotes((prev) => prev.filter((note) => note.id !== oldNote.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.raw_text.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleNoteCreated = (newNote: Note) => {
    setNotes((prev) => [newNote, ...prev])
    setUploadOpen(false)
  }

  const handleNoteDeleted = async (noteId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("notes").delete().eq("id", noteId)
    if (!error) {
      setNotes((prev) => prev.filter((n) => n.id !== noteId))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Notes</h1>
          <p className="text-muted-foreground">Manage and organize your study materials</p>
        </div>
        <Button onClick={() => setUploadOpen(true)} className="rounded-xl gap-2">
          <Plus className="h-4 w-4" />
          Upload Note
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>

      {filteredNotes.length === 0 ? (
        <Card className="glass-card rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{searchQuery ? "No notes found" : "No notes yet"}</h3>
            <p className="mt-1 text-sm text-muted-foreground text-center max-w-sm">
              {searchQuery
                ? "Try adjusting your search query"
                : "Upload your first note to get started with AI-powered studying"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setUploadOpen(true)} className="mt-4 rounded-xl">
                <Plus className="mr-2 h-4 w-4" />
                Upload Note
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <NoteCard key={note.id} note={note} onDelete={handleNoteDeleted} />
          ))}
        </div>
      )}

      <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} onNoteCreated={handleNoteCreated} />
    </div>
  )
}
