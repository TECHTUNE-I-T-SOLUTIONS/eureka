"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Send, Loader2, Sparkles, User } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChatMessage, Chat } from "@/lib/types"
import ReactMarkdown from "react-markdown"

interface ChatWindowProps {
  chat: Chat | null
  noteId?: string | null
}

export function ChatWindow({ chat, noteId }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (chat) {
      fetchMessages()
    } else {
      setMessages([])
    }
  }, [chat])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  const fetchMessages = async () => {
    if (!chat) return

    const supabase = createClient()
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("chat_id", chat.id)
      .order("created_at", { ascending: true })

    if (data) {
      setMessages(data)
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()

    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setIsLoading(true)

    // Add user message optimistically
    const tempUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      chat_id: chat?.id || "",
      sender: "user",
      content: userMessage,
      metadata: {},
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMessage])

    try {
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userMessage,
          chatId: chat?.id,
          noteId: noteId || chat?.note_id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: data.messageId || `temp-assistant-${Date.now()}`,
        chat_id: chat?.id || "",
        sender: "assistant",
        content: data.answer,
        metadata: {
          sources: data.sources,
          suggested_questions: data.suggested_questions,
          summary: data.summary,
        },
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      toast.error("Failed to get response", {
        description: "Please try again.",
      })
      // Remove the optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id))
      setInput(userMessage) // Restore input
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const suggestedQuestions =
    messages.length > 0
      ? messages[messages.length - 1].metadata?.suggested_questions
      : ["Summarize my notes", "What are the key concepts?", "Create practice questions"]

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 px-4">
        <div className="max-w-3xl mx-auto py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Start a conversation</h3>
              <p className="text-muted-foreground max-w-sm">
                Ask questions about your notes, request summaries, or generate practice questions.
              </p>

              {/* Suggested questions */}
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {suggestedQuestions?.map((question, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="rounded-xl bg-transparent"
                    onClick={() => {
                      setInput(question)
                      inputRef.current?.focus()
                    }}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => <MessageBubble key={message.id} message={message} />)
          )}

          {isLoading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border bg-background/80 backdrop-blur-xl p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="relative">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your notes..."
              className="min-h-[56px] max-h-[200px] resize-none rounded-2xl pr-14 py-4"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bottom-2 h-10 w-10 rounded-xl"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.sender === "user"

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-secondary" : "bg-primary text-primary-foreground",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          "flex-1 rounded-2xl px-4 py-3 max-w-[85%]",
          isUser ? "bg-primary text-primary-foreground ml-auto" : "bg-muted",
        )}
      >
        <div className={cn("prose prose-sm max-w-none", isUser ? "prose-invert" : "dark:prose-invert")}>
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

        {/* Suggested follow-up questions */}
        {!isUser && message.metadata?.suggested_questions && message.metadata.suggested_questions.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-2">Follow-up questions:</p>
            <div className="flex flex-wrap gap-2">
              {message.metadata.suggested_questions.map((q, i) => (
                <span key={i} className="text-xs bg-background/50 rounded-lg px-2 py-1">
                  {q}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
