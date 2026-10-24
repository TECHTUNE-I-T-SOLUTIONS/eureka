import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { openrouterChat, PAID_MODELS } from "@/lib/ai/openrouter"
import { checkAndUpdateNoteUsage } from "@/lib/usage-guard"

// Simple in-memory rate limiter to prevent overwhelming the API
const requestQueue: { resolve: (v: any) => void; reject: (e: any) => void; fn: () => Promise<string> }[] = []
let isProcessing = false
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 2000 // Minimum 2 seconds between requests

async function processQueue() {
  if (isProcessing || requestQueue.length === 0) return

  isProcessing = true

  while (requestQueue.length > 0) {
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime

    // Enforce minimum interval between requests
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest
      await new Promise((resolve) => setTimeout(resolve, waitTime))
    }

    const item = requestQueue.shift()
    if (item) {
      try {
        const result = await item.fn()
        item.resolve(result)
      } catch (error) {
        item.reject(error)
      }
      lastRequestTime = Date.now()
    }
  }

  isProcessing = false
}

// Queued request handler
async function queuedGenerateContent(model: any, prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    requestQueue.push({
      fn: async () => {
        try {
          const result = await model.generateContent(prompt)
          return result.response.text()
        } catch (error: any) {
          const errorMessage = error?.message || JSON.stringify(error)
          const statusCode = error?.status || error?.statusCode

          const is429 =
            statusCode === 429 ||
            errorMessage.includes("429") ||
            errorMessage.includes("Too Many Requests") ||
            errorMessage.includes("quota") ||
            errorMessage.includes("Quota exceeded") ||
            errorMessage.includes("rate limit") ||
            errorMessage.includes("RESOURCE_EXHAUSTED")

          if (is429) {
            console.error("Quota exceeded - free tier limit reached")
            return null as any
          }
          throw error
        }
      },
      resolve,
      reject,
    })

    processQueue()
  })
}

export async function POST(request: Request) {
  try {
    const { chatId, message, noteId } = await request.json()

    if (!chatId || !message) {
      return NextResponse.json({ error: "Chat ID and message are required" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify chat belongs to user
    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("*")
      .eq("id", chatId)
      .eq("user_id", user.id)
      .single()

    if (chatError || !chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    // Usage Guard Check
    const effectiveNoteId = noteId || chat.note_id
    const usageCheck = await checkAndUpdateNoteUsage(supabase, user.id, effectiveNoteId)
    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: usageCheck.error,
          code: "LIMIT_EXCEEDED",
          plan: usageCheck.plan,
          limit: usageCheck.limit,
          currentCount: usageCheck.currentCount,
        },
        { status: 403 }
      )
    }

    // Save user message
    const { data: userMessage, error: userMsgError } = await supabase
      .from("chat_messages")
      .insert({
        chat_id: chatId,
        sender: "user",
        content: message,
      })
      .select()
      .single()

    if (userMsgError) {
      return NextResponse.json({ error: "Failed to save message" }, { status: 500 })
    }

    // Get context from note if provided
    let context = ""
    if (noteId) {
      const { data: chunks } = await supabase.from("chunks").select("chunk_text").eq("note_id", noteId).limit(5)

      if (chunks && chunks.length > 0) {
        context = chunks.map((c) => c.chunk_text).join("\n\n")
      }
    }

    // Get user settings for explanation level
    const { data: settings } = await supabase.from("user_settings").select("explain_level").eq("id", user.id).single()

    const explainLevel = settings?.explain_level || "intermediate"

    // Generate AI response using Gemini 2.0 Flash
    const systemPrompt = `You are Eureka, a warm, enthusiastic, and deeply empathetic AI study assistant. Your mission is to transform how students learn by making complex ideas accessible, relatable, and genuinely exciting.

## Your Personality:
- **Genuinely caring**: Show authentic interest in the student's learning journey
- **Encouraging & supportive**: Celebrate their questions and progress
- **Patient & thorough**: Never rush explanations, always willing to go deeper
- **Conversational & relatable**: Use natural language, make connections to real-world examples
- **Adaptable**: Match the student's learning style and pace

## Communication Style:
- Start conversations warmly and personally
- Use the ${explainLevel} explanation level tailored specifically for them
- Format responses for clarity with proper markdown:
  - Use **bold** for key concepts
  - Use bullet points for lists and comparisons
  - Use numbered lists for sequences and steps
  - Use blockquotes for important notes or tips
- End with a genuine, encouraging statement when appropriate
- Ask follow-up questions to deepen understanding
- Acknowledge when something is complex and celebrate when they understand

## Explanation Levels:
${explainLevel === "beginner" ? "🎓 **Beginner**: Use simple, everyday language. Start with fundamentals. Use lots of analogies and real-world examples. Break complex ideas into tiny, digestible pieces. Avoid jargon or explain it immediately when you use it." : ""}
${explainLevel === "intermediate" ? "📚 **Intermediate**: Balance accessibility with depth. Use technical terms but explain them. Connect concepts to broader ideas. Include examples that show practical application." : ""}
${explainLevel === "advanced" ? "🔬 **Advanced**: Be detailed and technical. Assume strong foundational knowledge. Explore nuances, edge cases, and advanced applications. Challenge them with complex scenarios." : ""}

${context ? `## Context from Their Notes:\n${context}\n\nUse this context to provide answers that directly connect to what they're studying.` : ""}

## Rules:
- Always be encouraging and positive
- If you don't know something, say so genuinely
- When explaining, use structured formatting for readability
- Make the student feel heard and understood
- Provide specific examples from their notes when relevant
- Be concise but never sacrifice clarity for brevity`

    // Use OpenRouter paid models with fallback
    let text: string | null = null
    try {
      const result = await openrouterChat({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        modelList: PAID_MODELS,
        temperature: 0.7,
        max_tokens: 2048,
      })
      text = result.content
    } catch (err) {
      // All models failed
      return NextResponse.json(
        {
          error:
            "All AI models failed or are at capacity. Please try again later or check your OpenRouter account.",
          code: "QUOTA_EXCEEDED",
        },
        { status: 429 },
      )
    }
    if (!text) {
      return NextResponse.json(
        {
          error:
            "The AI service is temporarily at capacity. Please try again in a few moments.",
          code: "QUOTA_EXCEEDED",
        },
        { status: 429 },
      )
    }

    // Save assistant message
    const { data: assistantMessage, error: assistantMsgError } = await supabase
      .from("chat_messages")
      .insert({
        chat_id: chatId,
        sender: "assistant",
        content: text,
      })
      .select()
      .single()

    if (assistantMsgError) {
      return NextResponse.json({ error: "Failed to save response" }, { status: 500 })
    }

    // Update chat timestamp
    await supabase.from("chats").update({ updated_at: new Date().toISOString() }).eq("id", chatId)

    return NextResponse.json({ userMessage, assistantMessage })
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
