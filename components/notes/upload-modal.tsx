"use client"

import type React from "react"
import type { Note } from "@/lib/types"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Upload, FileText, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface UploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNoteCreated?: (note: Note) => void
}

export function UploadModal({ open, onOpenChange, onNoteCreated }: UploadModalProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const router = useRouter()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const file = files[0]

    if (file) {
      handleFile(file)
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleFile = async (file: File) => {
    const allowedTypes = ["text/plain", "application/pdf", "text/markdown"]

    if (!allowedTypes.includes(file.type) && !file.name.endsWith(".md") && !file.name.endsWith(".txt")) {
      toast.error("Unsupported file type", {
        description: "Please upload a .txt, .md, or .pdf file",
      })
      return
    }

    setUploadedFile(file)

    // If it's a text file, read it directly
    if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      const text = await file.text()
      setContent(text)
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""))
      }
    } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      // Extract text from PDF - only in browser
      try {
        const arrayBuffer = await file.arrayBuffer()
        
        // Dynamically import pdfjs only in browser to avoid SSR issues
        const pdfjsLib = await import("pdfjs-dist")
        
        // Set up PDF.js worker to use the local bundled version
        pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`
        
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
        let extractedText = ""

        // Extract text from all pages
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const textContent = await page.getTextContent()
          const pageText = textContent.items.map((item: any) => item.str).join(" ")
          extractedText += pageText + "\n"
        }

        setContent(extractedText)
        if (!title) {
          setTitle(file.name.replace(/\.[^/.]+$/, ""))
        }
        toast.success("PDF extracted!", {
          description: `Extracted ${Math.ceil(extractedText.length / 100)} paragraphs of text`,
        })
      } catch (error) {
        toast.error("Failed to extract PDF", {
          description: error instanceof Error ? error.message : "Could not read PDF file",
        })
        setUploadedFile(null)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error("Title required", { description: "Please enter a title for your note." })
      return
    }

    if (!content.trim() && !uploadedFile) {
      toast.error("Content required", { description: "Please enter some text or upload a file." })
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Not authenticated")
      }

      // Create the note
      const { data: note, error: noteError } = await supabase
        .from("notes")
        .insert({
          user_id: user.id,
          title: title.trim(),
          raw_text: content.trim(),
          uploaded_via: uploadedFile ? "file" : "text",
          status: "pending",
        })
        .select()
        .single()

      if (noteError) throw noteError

      // Trigger processing via API
      const response = await fetch("/api/notes/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId: note.id }),
      })

      if (!response.ok) {
        console.warn("Processing failed, but note was created")
      }

      toast.success("Note created!", {
        description: "Your note is being processed. We'll notify you when it's ready.",
      })

      onNoteCreated?.(note)
      onOpenChange(false)
      setTitle("")
      setContent("")
      setUploadedFile(null)
      router.refresh()
    } catch (error) {
      toast.error("Failed to create note", {
        description: error instanceof Error ? error.message : "An error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl glass-card border-border/50 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Upload Note</DialogTitle>
          <DialogDescription>Add a new note by typing, pasting, or uploading a file.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Chapter 5: Cell Biology"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl"
            />
          </div>

          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative border-2 border-dashed rounded-xl p-8 text-center transition-all",
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
              uploadedFile && "border-accent bg-accent/5",
            )}
          >
            {uploadedFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-accent" />
                <div className="text-left">
                  <p className="font-medium">{uploadedFile.name}</p>
                  <p className="text-sm text-muted-foreground">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-2"
                  onClick={() => {
                    setUploadedFile(null)
                    setContent("")
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Drag and drop a file here, or{" "}
                  <label className="text-primary hover:underline cursor-pointer">
                    browse
                    <input type="file" className="hidden" accept=".txt,.md,.pdf" onChange={handleFileInput} />
                  </label>
                </p>
                <p className="text-xs text-muted-foreground mt-1">Supports .txt, .md, .pdf files</p>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Or paste/type your notes</Label>
            <Textarea
              id="content"
              placeholder="Paste your notes here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] rounded-xl resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="rounded-xl">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Note"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
