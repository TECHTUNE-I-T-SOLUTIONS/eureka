import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { generateText } from "ai"
import { getSystemPrompt, buildRAGPrompt } from "@/lib/prompts"

export async function POST(request: Request) {
  try {
    const { query, chatId, noteId } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "Query required" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user settings for personalization
    const { data: settings } = await supabase.from("user_settings").select("*").eq("id", user.id).single()

    // Get relevant chunks
    let contexts: Array<{ text: string; noteTitle?: string; chunkIndex: number }> = []

    if (noteId) {
      // Get chunks from specific note
      const { data: chunks } = await supabase
        .from("chunks")
        .select("*, notes(title)")
        .eq("note_id", noteId)
        .order("chunk_index")
        .limit(10)

      if (chunks) {
        contexts = chunks.map((chunk) => ({
          text: chunk.chunk_text,
          noteTitle: (chunk.notes as { title: string } | null)?.title,
          chunkIndex: chunk.chunk_index,
        }))
      }
    } else {
      // Get chunks from all user's notes (simplified - would use embeddings in production)
      const { data: chunks } = await supabase
        .from("chunks")
        .select("*, notes!inner(title, user_id)")
        .eq("notes.user_id", user.id)
        .limit(20)

      if (chunks) {
        // Simple keyword matching for now (would use vector similarity in production)
        const queryWords = query.toLowerCase().split(/\s+/)
        const scoredChunks = chunks
          .map((chunk) => {
            const text = chunk.chunk_text.toLowerCase()
            const score = queryWords.filter((word) => text.includes(word)).length
            return { ...chunk, score }
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)

        contexts = scoredChunks.map((chunk) => ({
          text: chunk.chunk_text,
          noteTitle: (chunk.notes as { title: string } | null)?.title,
          chunkIndex: chunk.chunk_index,
        }))
      }
    }

    // Build prompt
    const systemPrompt = getSystemPrompt(settings)
    const fullPrompt = buildRAGPrompt(query, contexts, systemPrompt)

    // Generate response
    const { text: answer } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: fullPrompt,
      maxTokens: 2000,
    })

    // Generate follow-up questions
    const { text: questionsText } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `Based on this Q&A, suggest 3 brief follow-up questions the student might ask:\n\nQuestion: ${query}\n\nAnswer: ${answer}\n\nProvide just the questions, one per line, no numbering.`,
      maxTokens: 200,
    })

    const suggestedQuestions = questionsText
      .split("\n")
      .map((q) => q.trim())
      .filter((q) => q.length > 0)
      .slice(0, 3)

    // Save messages to chat if chatId provided
    let messageId = null
    if (chatId) {
      // Save user message
      await supabase.from("chat_messages").insert({
        chat_id: chatId,
        sender: "user",
        content: query,
      })

      // Save assistant message
      const { data: assistantMessage } = await supabase
        .from("chat_messages")
        .insert({
          chat_id: chatId,
          sender: "assistant",
          content: answer,
          metadata: {
            sources: contexts.map((c) => c.noteTitle).filter(Boolean),
            suggested_questions: suggestedQuestions,
          },
        })
        .select()
        .single()

      messageId = assistantMessage?.id

      // Update chat timestamp
      await supabase.from("chats").update({ updated_at: new Date().toISOString() }).eq("id", chatId)
    }

    return NextResponse.json({
      answer,
      sources: contexts.map((c) => c.noteTitle).filter(Boolean),
      suggested_questions: suggestedQuestions,
      messageId,
    })
  } catch (error) {
    console.error("AI ask error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate response" },
      { status: 500 },
    )
  }
}
