import { createClient } from "@/lib/supabase/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY)

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

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    const result = await model.generateContent(`${systemPrompt}\n\nStudent's question: ${message}`)
    const text = result.response.text()

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
