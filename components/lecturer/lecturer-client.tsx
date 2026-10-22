"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  BookOpen,
  Sparkles,
  GraduationCap,
  Settings,
  Loader2,
  Send,
  Layers,
  MessageCircle,
  Lightbulb,
  X,
  History,
  Clock,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"

interface Note {
  id: string
  title: string
  created_at: string
}

interface Lecture {
  id: string
  title: string
  note_id: string | null
  explanation_level: string
  created_at: string
}

interface LecturerClientProps {
  notes: Note[]
  initialExplanationLevel: "beginner" | "intermediate" | "advanced"
}

export function LecturerClient({ notes, initialExplanationLevel }: LecturerClientProps) {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [explanationLevel, setExplanationLevel] = useState<"beginner" | "intermediate" | "advanced">(
    initialExplanationLevel,
  )
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string; id?: number }>>([])
  const [currentExplanation, setCurrentExplanation] = useState("")
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])
  const [noteContent, setNoteContent] = useState("")
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [currentLectureId, setCurrentLectureId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      recognitionRef.current = new (window as any).webkitSpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = "en-US"

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error)
        setIsListening(false)
        toast.error("Speech recognition failed", {
          description: "Please try again or type your question.",
        })
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }

    // Initialize audio element
    if (typeof window !== "undefined") {
      audioRef.current = new Audio()
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (speechRef.current) {
        window.speechSynthesis.cancel()
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    fetchLectures()
  }, [])

  const fetchLectures = async () => {
    try {
      const response = await fetch("/api/lectures")
      if (!response.ok) {
        console.log("Lectures API not available yet")
        return
      }
      const data = await response.json()
      setLectures(data)
    } catch (error) {
      console.log("Lectures feature not available yet")
    }
  }

  const createNewLecture = async () => {
    try {
      const response = await fetch("/api/lectures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteId: selectedNoteId,
          title: selectedNoteId ? `Lecture on ${notes.find(n => n.id === selectedNoteId)?.title}` : "Free Lecture",
          explanationLevel,
        }),
      })

      if (!response.ok) {
        console.log("Lectures API not available - running without history")
        setCurrentLectureId(null)
        setMessages([])
        setCurrentExplanation("")
        setSuggestedQuestions([])
        toast.success("New lecture started (history not available)")
        return
      }

      const lecture = await response.json()
      setCurrentLectureId(lecture.id)
      setMessages([])
      setCurrentExplanation("")
      setSuggestedQuestions([])
      fetchLectures()
      toast.success("New lecture started")
    } catch (error) {
      console.log("Lectures feature not available - running without history")
      setCurrentLectureId(null)
      setMessages([])
      setCurrentExplanation("")
      setSuggestedQuestions([])
      toast.success("New lecture started (history not available)")
    }
  }

  const loadLecture = async (lectureId: string) => {
    try {
      // Fetch lecture messages
      const response = await fetch(`/api/lectures/${lectureId}/messages`)
      if (!response.ok) {
        toast.error("Failed to load lecture")
        return
      }

      const messages = await response.json()
      console.log("Loaded messages:", messages)

      // Find lecture details from the lectures state
      const lecture = lectures.find(l => l.id === lectureId)
      if (lecture) {
        setCurrentLectureId(lecture.id)
        setSelectedNoteId(lecture.note_id)
        setExplanationLevel(lecture.explanation_level as any)

        if (messages && messages.length > 0) {
          const mappedMessages = messages.map((m: any) => ({ role: m.sender as "user" | "assistant", content: m.content }))
          console.log("Mapped messages:", mappedMessages)
          setMessages(mappedMessages)

          // Set current explanation to the last assistant message
          const lastAssistantMessage = [...mappedMessages].reverse().find((m: any) => m.role === "assistant")
          if (lastAssistantMessage) {
            setCurrentExplanation(lastAssistantMessage.content)
          }
        } else {
          setMessages([])
          setCurrentExplanation("")
        }

        // Also fetch note content if a note is selected
        if (lecture.note_id) {
          await fetchNoteContent(lecture.note_id)
        }

        setShowHistory(false)
        toast.success("Lecture loaded")
      }
    } catch (error) {
      console.error("Error loading lecture:", error)
      toast.error("Failed to load lecture")
    }
  }

  const saveMessage = async (role: "user" | "assistant", content: string) => {
    if (!currentLectureId) {
      // Create lecture if it doesn't exist
      await createNewLecture()
      return
    }

    try {
      const response = await fetch(`/api/lectures/${currentLectureId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: role,
          content,
        }),
      })

      if (!response.ok) {
        console.log("Failed to save message - lectures feature might not be available")
      }
    } catch (error) {
      console.log("Lectures feature not available")
    }
  }

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  const fetchNoteContent = async (noteId: string) => {
    try {
      const supabase = createClient()
      const { data: chunks } = await supabase
        .from("chunks")
        .select("chunk_text")
        .eq("note_id", noteId)
        .order("chunk_index")

      if (chunks && chunks.length > 0) {
        const content = chunks.map((c) => c.chunk_text).join("\n\n")
        setNoteContent(content)
        return content
      }
      return ""
    } catch (error) {
      console.error("Error fetching note content:", error)
      return ""
    }
  }

  const handleNoteSelect = async (noteId: string) => {
    setSelectedNoteId(noteId)
    const content = await fetchNoteContent(noteId)
    if (content) {
      toast.success("Note loaded", {
        description: "Ready to start explaining!",
      })
    }
  }

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition not supported", {
        description: "Please use Chrome or Edge browser.",
      })
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const speakText = async (text: string) => {
    if (isSpeaking) {
      setIsSpeaking(false)
      return
    }

    // Only use Gemini TTS - no browser fallback
    try {
      setIsSpeaking(true)
      const response = await fetch("/api/lecturer/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error("Gemini TTS error:", error)
        toast.error("Gemini TTS failed", {
          description: error.error || "Unable to generate audio",
        })
        setIsSpeaking(false)
        return
      }

      const data = await response.json()
      
      if (data.error) {
        toast.error("Gemini TTS not available", {
          description: data.details || "Please check your API key configuration",
        })
        setIsSpeaking(false)
        return
      }

      // If we get audio data from Gemini, play it
      if (data.audio) {
        if (audioRef.current) {
          audioRef.current.src = data.audio
          audioRef.current.onended = () => setIsSpeaking(false)
          audioRef.current.onerror = () => {
            setIsSpeaking(false)
            toast.error("Failed to play audio")
          }
          await audioRef.current.play()
        }
      }
    } catch (error) {
      console.error("TTS error:", error)
      toast.error("TTS error", {
        description: "Gemini TTS is not working",
      })
      setIsSpeaking(false)
    }
  }

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsSpeaking(false)
  }

  // Robust parser for suggested questions
  const parseSuggestedQuestions = (questions: string[]): string[] => {
    if (!questions || questions.length === 0) return []

    const parsed: string[] = []

    for (const q of questions) {
      // Remove numbering (1., 2., 3., etc.)
      let cleaned = q.replace(/^\d+[\.\)]\s*/, "")

      // Remove bullets and dashes
      cleaned = cleaned.replace(/^[-•*]\s*/, "")

      // Remove quotes
      cleaned = cleaned.replace(/^["']|["']$/g, "")

      // Remove extra whitespace
      cleaned = cleaned.trim()

      // Split if multiple questions are on one line (separated by ? or .)
      const parts = cleaned.split(/[?\.]/).filter((p) => p.trim().length > 10)

      for (const part of parts) {
        const question = part.trim()
        if (question.length > 10 && question.length < 200 && parsed.length < 3) {
          // Add question mark if missing
          const finalQuestion = question.endsWith("?") ? question : `${question}?`
          parsed.push(finalQuestion)
        }
      }

      if (parsed.length >= 3) break
    }

    return parsed.slice(0, 3)
  }

  // Normalize malformed Markdown from AI
  const normalizeMarkdown = (text: string): string => {
    let normalized = text

    // Fix collapsed table rows - split rows that are on the same line
    // Pattern: | a | b | | :--- | :--- | -> split into two rows
    normalized = normalized.replace(/\|\s*\|\s*:/g, "|\n|:")

    // Fix sections without heading markers
    // Pattern: "Section 1: Title" -> "## Section 1: Title"
    normalized = normalized.replace(/^(Section \d+:)/gm, "## $1")

    // Fix malformed table rows where content is collapsed
    // Pattern: | Col1 | Col2 | Col3 | -> ensure proper spacing
    normalized = normalized.replace(/\|(?!\s)/g, "| ")

    // Convert $$...$$ to \[...\] for KaTeX
    normalized = normalized.replace(/\$\$([^$]+)\$\$/g, "\\[$1\\]")

    // Convert $...$ to \(...\) for inline math
    normalized = normalized.replace(/\$([^$]+)\$/g, "\\($1\\)")

    // Remove backslash line breaks
    normalized = normalized.replace(/\\\n/g, "\n")

    // Ensure blank lines between paragraphs
    normalized = normalized.replace(/([^\n])\n([A-Z])/g, "$1\n\n$2")

    // Fix ASCII diagrams - wrap in code blocks
    normalized = normalized.replace(/([+>-]{2,}.*\n?)+/g, (match) => {
      if (match.includes("+---") || match.includes("--->") || match.includes("->")) {
        return `\`\`\`\n${match}\n\`\`\``
      }
      return match
    })

    return normalized
  }

  const handleSubmit = async () => {
    const question = input.trim()
    if (!question && !noteContent) {
      toast.error("Please enter a question or select a note", {
        description: "I need something to explain!",
      })
      return
    }

    // Create lecture if not exists and wait for it
    if (!currentLectureId) {
      await createNewLecture()
      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // If still no lecture ID, continue without saving to history
    if (!currentLectureId) {
      console.log("No lecture ID available, continuing without history")
    }

    setIsLoading(true)
    const userMessage = question || "Please explain this note in detail"
    setInput("")

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    if (currentLectureId) {
      await saveMessage("user", userMessage)
    }

    // Add temporary loading message
    const loadingId = Date.now()
    setMessages((prev) => [...prev, { role: "assistant", content: "LOADING", id: loadingId }])

    try {
      const response = await fetch("/api/lecturer/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userMessage,
          noteId: selectedNoteId,
          noteContext: noteContent,
          explanationLevel,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      // Replace loading message with actual response
      setMessages((prev) => prev.filter((m) => m.id !== loadingId))
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }])
      setCurrentExplanation(data.answer)

      // Parse suggested questions more robustly
      const parsedQuestions = parseSuggestedQuestions(data.suggestedQuestions || [])
      setSuggestedQuestions(parsedQuestions)
      if (currentLectureId) {
        await saveMessage("assistant", data.answer)
      }
    } catch (error) {
      toast.error("Failed to get explanation", {
        description: "Please try again.",
      })
      // Remove loading message and user message
      setMessages((prev) => prev.filter((m) => m.id !== loadingId))
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartLecture = async () => {
    if (!selectedNoteId) {
      toast.error("Please select a note first", {
        description: "I need content to lecture about!",
      })
      return
    }

    const content = await fetchNoteContent(selectedNoteId)
    if (!content) {
      toast.error("Could not load note content")
      return
    }

    setInput("Please provide a comprehensive lecture on this note, explaining all key concepts, providing examples, and connecting ideas together.")
    handleSubmit()
  }

  return (
    <div className="flex h-screen flex-col lg:flex-row overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Lecturer Mode</h2>
            <p className="text-xs text-muted-foreground">Interactive AI Learning</p>
          </div>
        </div>
        <Button
          onClick={() => setIsSettingsOpen(true)}
          variant="outline"
          size="icon"
          className="rounded-xl"
        >
          <Settings className="h-5 w-5" />
        </Button>
        <Button
          onClick={() => setShowHistory(true)}
          variant="outline"
          size="icon"
          className="rounded-xl"
        >
          <History className="h-5 w-5" />
        </Button>
      </div>

      {/* Sidebar - Controls (Desktop) */}
      <div className="hidden lg:flex w-80 flex-shrink-0 border-r border-border bg-background/50 backdrop-blur-xl p-4 flex-col gap-4 overflow-y-auto">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold">Lecturer Mode</h2>
            <p className="text-xs text-muted-foreground">Interactive AI Learning</p>
          </div>
        </div>

        <Separator />

        {/* Note Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Note to Study</label>
          <Select value={selectedNoteId || ""} onValueChange={handleNoteSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a note..." />
            </SelectTrigger>
            <SelectContent>
              {notes.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">No notes available</div>
              ) : (
                notes.map((note) => (
                  <SelectItem key={note.id} value={note.id}>
                    {note.title}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Explanation Level */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Explanation Level</label>
          <Select value={explanationLevel} onValueChange={(value: any) => setExplanationLevel(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>Beginner</span>
                </div>
              </SelectItem>
              <SelectItem value="intermediate">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  <span>Intermediate</span>
                </div>
              </SelectItem>
              <SelectItem value="advanced">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Advanced</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Quick Actions */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Quick Actions</label>
          <Button
            onClick={handleStartLecture}
            disabled={!selectedNoteId || isLoading}
            className="w-full"
            variant="default"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Full Lecture
          </Button>
          <Button
            onClick={() => {
              setInput("Summarize the key points from this note")
              handleSubmit()
            }}
            disabled={!selectedNoteId || isLoading}
            className="w-full"
            variant="outline"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Quick Summary
          </Button>
          <Button
            onClick={() => {
              setInput("Generate 5 practice questions based on this content")
              handleSubmit()
            }}
            disabled={!selectedNoteId || isLoading}
            className="w-full"
            variant="outline"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Practice Questions
          </Button>
        </div>

        <Separator />

        {/* Lecture History (Desktop) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Lecture History</label>
            <Button
              onClick={() => fetchLectures()}
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
            >
              <Loader2 className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {lectures.length === 0 ? (
              <div className="text-xs text-muted-foreground p-2">No lecture history</div>
            ) : (
              lectures.map((lecture) => (
                <motion.div
                  key={lecture.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => loadLecture(lecture.id)}
                >
                  <div className="flex items-start gap-2">
                    <Clock className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{lecture.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(lecture.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="mt-auto">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            <p>Use voice input for hands-free learning</p>
          </div>
        </div>
      </div>

      {/* Main Content - Chalkboard */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Chalkboard Display */}
        <div className="flex-1 p-2 lg:p-4 overflow-hidden min-h-0">
          <Card className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-slate-700 dark:border-slate-800 relative overflow-hidden flex flex-col">
            {/* Chalkboard texture overlay */}
            <div className="absolute inset-0 opacity-5 dark:opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+Cjwvc3ZnPg==')]"></div>

            <ScrollArea className="flex-1 relative z-10 h-full">
              <div className="max-w-2xl lg:max-w-3xl mx-auto py-4 lg:py-6 px-3 lg:px-4 pb-20">
                {messages.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex flex-col items-center justify-center h-full min-h-[300px] lg:min-h-[400px] text-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="flex h-16 w-16 lg:h-20 lg:w-20 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 mb-6"
                      >
                        <GraduationCap className="h-8 w-8 lg:h-10 lg:w-10" />
                      </motion.div>
                      <h3 className="text-xl lg:text-2xl font-bold text-white mb-3">Welcome to Lecturer Mode</h3>
                      <p className="text-slate-300 max-w-md mb-6 text-sm lg:text-base">
                        Select a note and I'll explain it to you like a real lecturer. Ask questions, get examples, and learn interactively!
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 lg:gap-3">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Badge variant="outline" className="border-slate-600 text-slate-300 flex items-center gap-1">
                            <Mic className="h-3 w-3" />
                            <span className="text-xs">Voice Input</span>
                          </Badge>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <Badge variant="outline" className="border-slate-600 text-slate-300 flex items-center gap-1">
                            <Volume2 className="h-3 w-3" />
                            <span className="text-xs">Audio Output</span>
                          </Badge>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          <Badge variant="outline" className="border-slate-600 text-slate-300 flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            <span className="text-xs">Visual Explanations</span>
                          </Badge>
                        </motion.div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4 lg:space-y-6"
                    >
                      {messages.map((message, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={cn(
                            "rounded-2xl p-4 lg:p-6",
                            message.role === "user"
                              ? "bg-slate-200/50 dark:bg-slate-700/50 border border-slate-400 dark:border-slate-600 ml-auto max-w-[90%] lg:max-w-[80%]"
                              : "bg-transparent",
                          )}
                        >
                          {message.role === "assistant" ? (
                            <div className="prose prose-sm lg:prose-base max-w-none prose-invert">
                              {message.content === "LOADING" ? (
                                <div className="flex items-center gap-2 text-slate-400">
                                  <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                  </div>
                                  <span className="text-sm">AI is thinking...</span>
                                </div>
                              ) : (
                                <>
                                  <style jsx global>{`
                                    .prose {
                                      color: rgb(203, 213, 225);
                                      line-height: 1.75;
                                    }
                                    .prose p {
                                      margin-bottom: 1.25rem;
                                      line-height: 1.75;
                                    }
                                    .prose h1,
                                    .prose h2,
                                    .prose h3,
                                    .prose h4,
                                    .prose h5,
                                    .prose h6 {
                                      color: rgb(255, 255, 255);
                                      margin-top: 2rem;
                                      margin-bottom: 1rem;
                                      line-height: 1.3;
                                    }
                                    .prose h1 { font-size: 2.25rem; }
                                    .prose h2 { font-size: 1.875rem; }
                                    .prose h3 { font-size: 1.5rem; }
                                    .prose h4 { font-size: 1.25rem; }
                                    .prose strong {
                                      color: rgb(255, 255, 255);
                                      font-weight: 600;
                                    }
                                    .prose a {
                                      color: rgb(52, 211, 153);
                                      text-decoration: underline;
                                    }
                                    .prose a:hover {
                                      color: rgb(16, 185, 129);
                                    }
                                    .prose code {
                                      color: rgb(52, 211, 153);
                                      background-color: rgb(30, 41, 59);
                                      padding: 0.2rem 0.4rem;
                                      border-radius: 0.25rem;
                                      font-size: 0.875em;
                                    }
                                    .prose pre {
                                      background-color: rgb(15, 23, 42);
                                      border: 1px solid rgb(51, 65, 85);
                                      padding: 1rem;
                                      border-radius: 0.5rem;
                                      overflow-x: auto;
                                      margin: 1.5rem 0;
                                    }
                                    .prose pre code {
                                      background-color: transparent;
                                      color: rgb(203, 213, 225);
                                      padding: 0;
                                    }
                                    .prose blockquote {
                                      border-left-color: rgb(52, 211, 153);
                                      color: rgb(148, 163, 184);
                                      padding-left: 1rem;
                                      margin: 1.5rem 0;
                                      font-style: italic;
                                    }
                                    .prose ul,
                                    .prose ol {
                                      color: rgb(203, 213, 225);
                                      margin: 1.25rem 0;
                                      padding-left: 1.5rem;
                                    }
                                    .prose li {
                                      color: rgb(203, 213, 225);
                                      margin-bottom: 0.5rem;
                                      line-height: 1.75;
                                    }
                                    .prose table {
                                      display: block;
                                      overflow-x: auto;
                                      white-space: nowrap;
                                      margin: 1.5rem 0;
                                      border-collapse: collapse;
                                      width: 100%;
                                      color: rgb(203, 213, 225);
                                    }
                                    .prose th,
                                    .prose td {
                                      border: 1px solid rgb(71, 85, 105);
                                      padding: 0.75rem 1rem;
                                      text-align: left;
                                      min-width: 120px;
                                      color: rgb(203, 213, 225);
                                    }
                                    .prose th {
                                      background-color: rgb(30, 41, 59);
                                      font-weight: 600;
                                      color: rgb(255, 255, 255);
                                    }
                                    .prose tr:nth-child(even) {
                                      background-color: rgb(30, 41, 59);
                                    }
                                    .prose hr {
                                      border-color: rgb(71, 85, 105);
                                      margin: 2rem 0;
                                    }
                                    .prose pre {
                                      overflow-x: auto;
                                      white-space: pre-wrap;
                                      word-wrap: break-word;
                                    }
                                    /* KaTeX styling */
                                    .katex {
                                      font-size: 1.1em;
                                      color: rgb(203, 213, 225);
                                    }
                                    .katex-display {
                                      margin: 1.5em 0;
                                      overflow-x: auto;
                                      overflow-y: hidden;
                                    }
                                  `}</style>
                                  <ReactMarkdown
                                    remarkPlugins={[remarkMath]}
                                    rehypePlugins={[rehypeKatex]}
                                  >
                                    {normalizeMarkdown(message.content)}
                                  </ReactMarkdown>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="text-slate-200">
                              <p className="text-xs lg:text-sm text-slate-400 mb-2">You asked:</p>
                              <p className="text-sm lg:text-base">{message.content}</p>
                            </div>
                          )}
                        </motion.div>
                      ))}

                      <AnimatePresence>
                        {isLoading && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-slate-700/50 border border-slate-600 rounded-2xl p-4 lg:p-6"
                          >
                            <div className="flex items-center gap-3 text-slate-300">
                              <Loader2 className="h-5 w-5 animate-spin" />
                              <span className="text-sm lg:text-base">Preparing explanation...</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div ref={scrollRef} />
                    </motion.div>
                  )}
              </div>
            </ScrollArea>

            {/* Audio Controls Overlay */}
            {currentExplanation && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute bottom-4 right-4 z-20"
              >
                <Button
                  onClick={() => speakText(currentExplanation)}
                  size="lg"
                  className="rounded-full h-12 w-12 lg:h-14 lg:w-14 bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSpeaking ? <Pause className="h-5 w-5 lg:h-6 lg:w-6" /> : <Volume2 className="h-5 w-5 lg:h-6 lg:w-6" />}
                </Button>
              </motion.div>
            )}
          </Card>
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-background/80 backdrop-blur-xl p-3 lg:p-4 shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2 lg:gap-3">
              <Button
                onClick={toggleListening}
                variant={isListening ? "destructive" : "outline"}
                size="icon"
                className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl shrink-0"
              >
                {isListening ? <MicOff className="h-4 w-4 lg:h-5 lg:w-5" /> : <Mic className="h-4 w-4 lg:h-5 lg:w-5" />}
              </Button>

              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about your notes..."
                className="min-h-[48px] max-h-[100px] lg:min-h-[56px] lg:max-h-[120px] resize-none rounded-2xl text-sm lg:text-base"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
              />

              <Button
                onClick={handleSubmit}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl shrink-0"
              >
                {isLoading ? <Loader2 className="h-4 w-4 lg:h-5 lg:w-5 animate-spin" /> : <Send className="h-4 w-4 lg:h-5 lg:w-5" />}
              </Button>
            </div>

            {/* Suggested Questions */}
            <AnimatePresence>
              {suggestedQuestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 lg:mt-4 flex flex-wrap gap-2 w-full"
                >
                  {suggestedQuestions.map((question, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex-1 min-w-[180px] max-w-[300px]"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl text-xs lg:text-sm w-full h-auto py-2 px-3 text-left leading-relaxed break-words whitespace-normal text-wrap"
                        onClick={() => {
                          setInput(question)
                        }}
                      >
                        {question}
                      </Button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Settings Modal (Mobile) */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Lecturer Settings
            </DialogTitle>
            <DialogDescription>
              Configure your lecture preferences and select notes to study
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Note Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Note to Study</label>
              <Select value={selectedNoteId || ""} onValueChange={handleNoteSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a note..." />
                </SelectTrigger>
                <SelectContent>
                  {notes.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No notes available</div>
                  ) : (
                    notes.map((note) => (
                      <SelectItem key={note.id} value={note.id}>
                        {note.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Explanation Level */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Explanation Level</label>
              <Select value={explanationLevel} onValueChange={(value: any) => setExplanationLevel(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      <span>Beginner</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="intermediate">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      <span>Intermediate</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="advanced">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      <span>Advanced</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Quick Actions */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quick Actions</label>
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    handleStartLecture()
                    setIsSettingsOpen(false)
                  }}
                  disabled={!selectedNoteId || isLoading}
                  className="w-full"
                  variant="default"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Full Lecture
                </Button>
                <Button
                  onClick={() => {
                    setInput("Summarize the key points from this note")
                    handleSubmit()
                    setIsSettingsOpen(false)
                  }}
                  disabled={!selectedNoteId || isLoading}
                  className="w-full"
                  variant="outline"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Quick Summary
                </Button>
                <Button
                  onClick={() => {
                    setInput("Generate 5 practice questions based on this content")
                    handleSubmit()
                    setIsSettingsOpen(false)
                  }}
                  disabled={!selectedNoteId || isLoading}
                  className="w-full"
                  variant="outline"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Practice Questions
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground flex items-center gap-2 pt-2">
              <Lightbulb className="h-4 w-4" />
              <p>Use voice input for hands-free learning</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lecture History Modal */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="sm:max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Lecture History
            </DialogTitle>
            <DialogDescription>
              View and load your past lecture sessions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4 overflow-y-auto max-h-[60vh]">
            {lectures.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No lecture history yet</p>
                <p className="text-sm mt-1">Start a lecture to see it here</p>
              </div>
            ) : (
              lectures.map((lecture) => (
                <motion.div
                  key={lecture.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 border border-border rounded-xl hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => loadLecture(lecture.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{lecture.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(lecture.created_at).toLocaleDateString()}</span>
                        {lecture.note_id && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{lecture.explanation_level}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        loadLecture(lecture.id)
                      }}
                    >
                      Load
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={() => {
                createNewLecture()
                setShowHistory(false)
              }}
              className="flex-1"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Start New Lecture
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
