import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { openrouterChat, PAID_MODELS } from "@/lib/ai/openrouter"
import { getSystemPrompt, buildRAGPrompt } from "@/lib/prompts"
import { checkAndUpdateNoteUsage } from "@/lib/usage-guard"

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

    // Usage Guard Check
    const usageCheck = await checkAndUpdateNoteUsage(supabase, user.id, noteId)
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
      // Get chunks from all user's notes
      const { data: chunks } = await supabase
        .from("chunks")
        .select("*, notes!inner(title, user_id)")
        .eq("notes.user_id", user.id)
        .limit(20)

      if (chunks) {
        const queryWords = query.toLowerCase().split(/\s+/)
        const scoredChunks = chunks
          .map((chunk) => {
            const text = chunk.chunk_text.toLowerCase()
            const score = queryWords.filter((word: string) => text.includes(word)).length
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

    // Generate response using OpenRouter
    const { content: answer } = await openrouterChat({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: fullPrompt },
      ],
      modelList: PAID_MODELS,
      temperature: 0.5,
      max_tokens: 2000,
    })

    // Generate follow-up questions
    const { content: questionsText } = await openrouterChat({
      messages: [
        {
          role: "user",
          content: `Based on this Q&A, suggest 3 brief follow-up questions the student might ask:\n\nQuestion: ${query}\n\nAnswer: ${answer}\n\nProvide just the questions, one per line, no numbering.`,
        },
      ],
      modelList: PAID_MODELS,
      temperature: 0.5,
      max_tokens: 200,
    })

    const suggestedQuestions = questionsText
      .split("\n")
      .map((q) => q.trim())
      .filter((q) => q.length > 0)
      .slice(0, 3)

    // Save messages to chat if chatId provided
    let messageId = null
    if (chatId) {
      await supabase.from("chat_messages").insert({
        chat_id: chatId,
        sender: "user",
        content: query,
      })

      const { data: assistantMsg } = await supabase
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

      if (assistantMsg) {
        messageId = assistantMsg.id
      }
    }

    return NextResponse.json({
      answer,
      suggestedQuestions,
      sources: contexts.map((c) => ({
        text: c.text.slice(0, 150) + "...",
        noteTitle: c.noteTitle,
      })),
      messageId,
    })
  } catch (error) {
    console.error("AI ask route error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate answer" },
      { status: 500 }
    )
  }
}
