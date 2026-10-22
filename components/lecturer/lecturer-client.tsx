"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"

interface Note {
  id: string
  title: string
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
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])
  const [currentExplanation, setCurrentExplanation] = useState("")
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])
  const [noteContent, setNoteContent] = useState("")
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null)

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

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (speechRef.current) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

  const speakText = (text: string) => {
    if (!window.speechSynthesis) {
      toast.error("Text-to-speech not supported")
      return
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1
    utterance.pitch = 1
    utterance.volume = 1

    utterance.onend = () => {
      setIsSpeaking(false)
    }

    utterance.onerror = () => {
      setIsSpeaking(false)
    }

    speechRef.current = utterance
    window.speechSynthesis.speak(utterance)
    setIsSpeaking(true)
  }

  const stopSpeaking = () => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }

  const handleSubmit = async () => {
    const question = input.trim()
    if (!question && !noteContent) {
      toast.error("Please enter a question or select a note", {
        description: "I need something to explain!",
      })
      return
    }

    setIsLoading(true)
    const userMessage = question || "Please explain this note in detail"
    setInput("")

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])

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

      // Add assistant message
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }])
      setCurrentExplanation(data.answer)
      setSuggestedQuestions(data.suggestedQuestions || [])

      // Auto-speak the response (optional - can be made configurable)
      // speakText(data.answer)
    } catch (error) {
      toast.error("Failed to get explanation", {
        description: "Please try again.",
      })
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
    <div className="flex h-full flex-col lg:flex-row">
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
      </div>

      {/* Sidebar - Controls (Desktop) */}
      <div className="hidden lg:flex w-80 border-r border-border bg-background/50 backdrop-blur-xl p-4 flex-col gap-4">
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

        <div className="mt-auto">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            <p>Use voice input for hands-free learning</p>
          </div>
        </div>
      </div>

      {/* Main Content - Chalkboard */}
      <div className="flex-1 flex flex-col">
        {/* Chalkboard Display */}
        <div className="flex-1 p-4 lg:p-6 overflow-hidden">
          <Card className="h-full bg-gradient-to-br from-background/20 to-background border-slate-700 relative overflow-hidden">
            {/* Chalkboard texture overlay */}
            <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+Cjwvc3ZnPg==')]"></div>

            <ScrollArea className="h-full relative z-10">
              <div className="max-w-4xl mx-auto py-6 lg:py-8 px-4 lg:px-6">
                <AnimatePresence mode="wait">
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
                        className="flex h-16 w-16 lg:h-20 lg:w-20 items-center justify-center rounded-2xl bg-black/20 dark:bg-foreground/20 text-emerald-400 mb-6"
                      >
                        <GraduationCap className="h-8 w-8 lg:h-10 lg:w-10" />
                      </motion.div>
                      <h3 className="text-xl lg:text-2xl font-bold text-foreground dark:text-white mb-3">Welcome to Lecturer Mode</h3>
                      <p className="dark:text-slate-300 text-slate-700 max-w-md mb-6 text-sm lg:text-base">
                        Select a note and I'll explain it to you like a real lecturer. Ask questions, get examples, and learn interactively!
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 lg:gap-3">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Badge variant="outline" className="border-slate-600 dark:text-slate-300 text- flex items-center gap-1">
                            <Mic className="h-3 w-3" />
                            <span className="text-xs">Voice Input</span>
                          </Badge>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <Badge variant="outline" className="border-slate-600 dark:text-slate-300 text-black flex items-center gap-1">
                            <Volume2 className="h-3 w-3" />
                            <span className="text-xs">Audio Output</span>
                          </Badge>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          <Badge variant="outline" className="border-slate-600 dark:text-slate-300 text-black flex items-center gap-1">
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
                              ? "dark:bg-slate-700/50 bg-slate-100 border border-slate-600 ml-auto max-w-[90%] lg:max-w-[80%]"
                              : "bg-transparent",
                          )}
                        >
                          {message.role === "assistant" ? (
                            <div className="prose prose-invert prose-sm lg:prose-lg max-w-none">
                              <ReactMarkdown>{message.content}</ReactMarkdown>
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
                </AnimatePresence>
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
        <div className="border-t border-border bg-background/80 backdrop-blur-xl p-3 lg:p-4">
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
                  className="mt-3 lg:mt-4 flex flex-wrap gap-2"
                >
                  {suggestedQuestions.map((question, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl text-xs lg:text-sm"
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
    </div>
  )
}
