"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Plus, Send, Loader2, MessageSquare, Sparkles, FileText, History, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import ReactMarkdown from "react-markdown"
import type { Chat, ChatMessage, Note } from "@/lib/types"

interface ChatPageClientProps {
  initialChats: Chat[]
  notes: Pick<Note, "id" | "title" | "status">[]
  initialNoteId?: string
  initialChatId?: string
  userId: string
  startNew?: boolean
}

export function ChatPageClient({
  initialChats,
  notes,
  initialNoteId,
  initialChatId,
  userId,
  startNew,
}: ChatPageClientProps) {
  const [chats, setChats] = useState(initialChats)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(initialChatId || null)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(initialNoteId || null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load messages when chat is selected
  useEffect(() => {
    if (selectedChatId) {
      loadMessages(selectedChatId)
    } else {
      setMessages([])
    }
  }, [selectedChatId])

  // Start new chat if startNew is true
  useEffect(() => {
    if (startNew) {
      setSelectedChatId(null)
      setMessages([])
    }
  }, [startNew])

  const loadMessages = async (chatId: string) => {
    setIsLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })

    setMessages(data || [])
    setIsLoading(false)
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
  }

  const createNewChat = async () => {
    const supabase = createClient()
    const title = selectedNoteId
      ? `Chat about ${notes.find((n) => n.id === selectedNoteId)?.title || "Note"}`
      : "New Study Session"

    const { data, error } = await supabase
      .from("chats")
      .insert({
        user_id: userId,
        title,
        note_id: selectedNoteId,
      })
      .select()
      .single()

    if (error) {
      toast.error("Failed to create chat")
      return null
    }

    setChats((prev) => [data, ...prev])
    setSelectedChatId(data.id)
    return data.id
  }

  const handleSend = async () => {
    if (!input.trim()) return

    setIsSending(true)
    const userMessage = input.trim()
    setInput("")

    // Create chat if needed
    let chatId = selectedChatId
    if (!chatId) {
      chatId = await createNewChat()
      if (!chatId) {
        setIsSending(false)
        return
      }
    }

    // Add user message optimistically
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      chat_id: chatId,
      sender: "user",
      content: userMessage,
      metadata: {},
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMsg])
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          message: userMessage,
          noteId: selectedNoteId,
        }),
      })

      const data = await response.json()

      // Handle rate limiting (429)
      if (response.status === 429) {
        const retryAfter = data.retryAfter ? Math.ceil(data.retryAfter / 60) : 1
        toast.error(
          data.error || `Free tier quota exceeded. Please try again in ${retryAfter} hour(s).`,
          {
            action: {
              label: "Upgrade",
              onClick: () => window.open("https://aistudio.google.com/api-keys", "_blank"),
            },
          }
        )
        setMessages((prev) => prev.filter((m) => !m.id.startsWith("temp-")))
        return
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message")
      }

      // Update messages with actual data
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => !m.id.startsWith("temp-"))
        return [...withoutTemp, data.userMessage, data.assistantMessage]
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send message")
      setMessages((prev) => prev.filter((m) => !m.id.startsWith("temp-")))
    } finally {
      setIsSending(false)
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    }
  }

  const deleteChat = async (chatId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("chats").delete().eq("id", chatId)

    if (!error) {
      setChats((prev) => prev.filter((c) => c.id !== chatId))
      if (selectedChatId === chatId) {
        setSelectedChatId(null)
        setMessages([])
      }
      toast.success("Chat deleted")
    } else {
      toast.error("Failed to delete chat")
    }
  }

  const selectedChat = chats.find((c) => c.id === selectedChatId)

  return (
    <div className="flex h-full w-full">
      {/* Chat History Sidebar - Desktop */}
      <div className="hidden w-64 shrink-0 border-r lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b p-4">
            <Button
              onClick={() => {
                setSelectedChatId(null)
                setMessages([])
              }}
              className="w-full rounded-xl gap-2"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </div>
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-1">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={cn(
                    "group flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors cursor-pointer hover:bg-muted",
                    selectedChatId === chat.id && "bg-muted",
                  )}
                  onClick={() => setSelectedChatId(chat.id)}
                >
                  <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 truncate">
                    <p className="truncate font-medium">{chat.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteChat(chat.id)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
              {chats.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">No chat history</p>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b p-4">
          {/* Mobile History Button */}
          <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-xl lg:hidden bg-transparent">
                <History className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SheetHeader className="border-b p-4">
                <SheetTitle>Chat History</SheetTitle>
              </SheetHeader>
              <div className="p-4">
                <Button
                  onClick={() => {
                    setSelectedChatId(null)
                    setMessages([])
                    setHistoryOpen(false)
                  }}
                  className="w-full rounded-xl gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Chat
                </Button>
              </div>
              <ScrollArea className="h-[calc(100vh-140px)] px-2">
                <div className="space-y-1">
                  {chats.map((chat) => (
                    <div
                      key={chat.id}
                      className={cn(
                        "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors cursor-pointer hover:bg-muted",
                        selectedChatId === chat.id && "bg-muted",
                      )}
                      onClick={() => {
                        setSelectedChatId(chat.id)
                        setHistoryOpen(false)
                      }}
                    >
                      <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex-1 truncate">
                        <p className="truncate font-medium">{chat.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          <div className="flex flex-1 items-center gap-2">
            <h2 className="font-semibold truncate">{selectedChat?.title || "New Chat"}</h2>
          </div>

          <Select value={selectedNoteId || "none"} onValueChange={(v) => setSelectedNoteId(v === "none" ? null : v)}>
            <SelectTrigger className="w-[180px] rounded-xl">
              <FileText className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select note" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No note selected</SelectItem>
              {notes.map((note) => (
                <SelectItem key={note.id} value={note.id}>
                  {note.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Start a conversation</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {selectedNoteId
                  ? "Ask questions about your selected note and get AI-powered answers."
                  : "Select a note to get context-aware answers, or just start chatting."}
              </p>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn("flex gap-3", message.sender === "user" ? "justify-end" : "justify-start")}
                >
                  {message.sender === "assistant" && (
                    <Avatar className="h-8 w-8 shrink-0 mt-1">
                      <AvatarImage src="/Eureka-01.png" alt="Eureka" />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Sparkles className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3",
                      message.sender === "user" 
                        ? "bg-primary text-primary-foreground rounded-br-none" 
                        : "bg-gradient-to-br from-muted to-muted/50 border border-primary/10 rounded-bl-none",
                    )}
                  >
                    {message.sender === "assistant" ? (
                      <div className="text-sm space-y-2">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="text-sm leading-relaxed">{children}</p>,
                            ul: ({ children }) => <ul className="ml-4 space-y-1 list-disc">{children}</ul>,
                            ol: ({ children }) => <ol className="ml-4 space-y-1 list-decimal">{children}</ol>,
                            strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                            em: ({ children }) => <em className="italic text-primary/80">{children}</em>,
                            code: ({ children }) => (
                              <code className="bg-black/20 px-2 py-1 rounded text-xs font-mono">{children}</code>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-primary/50 pl-3 italic opacity-80">{children}</blockquote>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    )}
                  </div>
                  {message.sender === "user" && (
                    <Avatar className="h-8 w-8 shrink-0 mt-1">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">U</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isSending && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0 mt-1">
                    <AvatarImage src="/Eureka-01.png" alt="Eureka" />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Sparkles className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-2xl rounded-bl-none bg-gradient-to-br from-muted to-muted/50 border border-primary/10 px-4 py-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Eureka is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="border-t p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 rounded-xl"
              disabled={isSending}
            />
            <Button type="submit" disabled={isSending || !input.trim()} className="rounded-xl">
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
