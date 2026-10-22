import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { generateLecturerResponse, LECTURER_MODELS } from "@/lib/ai/gemini-live"

export async function POST(request: Request) {
  try {
    const { question, noteId, noteContext, explanationLevel = "intermediate" } = await request.json()

    if (!question && !noteContext) {
      return NextResponse.json({ error: "Question or note context required" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // If noteId is provided but noteContext isn't, fetch it
    let context = noteContext
    if (noteId && !context) {
      const { data: chunks } = await supabase
        .from("chunks")
        .select("chunk_text, notes(title)")
        .eq("note_id", noteId)
        .order("chunk_index")
        .limit(20)

      if (chunks && chunks.length > 0) {
        const noteTitle = (chunks[0].notes as { title: string } | null)?.title || "Note"
        context = `Note: ${noteTitle}\n\n${chunks.map((c) => c.chunk_text).join("\n\n")}`
      }
    }

    // Try Gemini first (FREE tier)
    try {
      const response = await generateLecturerResponse(question, {
        context: context || "",
        noteContext: context || "",
        explanationLevel,
        model: LECTURER_MODELS.GEMINI_3_5_FLASH_LITE, // Use free tier model (gemini-3.5-flash-lite)
      })

      return NextResponse.json({
        answer: response.text,
        suggestedQuestions: response.suggestedQuestions,
        model: "gemini",
      })
    } catch (geminiError) {
      console.error("Gemini API error, falling back to OpenRouter:", geminiError)

      // Fallback to OpenRouter if Gemini fails
      const { openrouterChat, PAID_MODELS } = await import("@/lib/ai/openrouter")

      const systemPrompt = buildLecturerSystemPrompt(explanationLevel, context || "")

      const result = await openrouterChat({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question || "Please explain this note in detail" },
        ],
        modelList: PAID_MODELS,
        temperature: 0.8,
        max_tokens: 2000,
      })

      // Generate follow-up questions
      const followUpResult = await openrouterChat({
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant. Generate 3 follow-up questions based on the Q&A.",
          },
          {
            role: "user",
            content: `Based on this Q&A, suggest 3 follow-up questions a student might ask:\n\nQuestion: ${question}\n\nAnswer: ${result.content}\n\nProvide just the questions, one per line, no numbering.`,
          },
        ],
        modelList: PAID_MODELS,
        temperature: 0.7,
        max_tokens: 150,
      })

      const suggestedQuestions = followUpResult.content
        .split("\n")
        .map((q) => q.trim())
        .filter((q) => q.length > 0)
        .slice(0, 3)

      return NextResponse.json({
        answer: result.content,
        suggestedQuestions,
        model: "openrouter",
      })
    }
  } catch (error) {
    console.error("Lecturer API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate explanation" },
      { status: 500 },
    )
  }
}

function buildLecturerSystemPrompt(
  explanationLevel: "beginner" | "intermediate" | "advanced",
  context: string,
): string {
  let prompt = `You are an enthusiastic and engaging lecturer who explains concepts in a clear, structured way. Your teaching style is:

${explanationLevel === "beginner" ? `
**Beginner Level:**
- Start with fundamental concepts
- Use everyday analogies and real-world examples
- Break complex ideas into small, digestible pieces
- Avoid jargon or explain it immediately
- Be patient and encouraging
` : explanationLevel === "intermediate" ? `
**Intermediate Level:**
- Balance accessibility with depth
- Use technical terms but explain them
- Connect concepts to broader ideas
- Include practical applications
- Assume some foundational knowledge
` : `
**Advanced Level:**
- Be detailed and technical
- Assume strong foundational knowledge
- Explore nuances, edge cases, and advanced applications
- Challenge with complex scenarios
- Include theoretical underpinnings
`}

**Teaching Approach:**
- Start with a brief overview or "hook" to engage interest
- Explain concepts step-by-step with clear structure
- Use examples and analogies to make abstract ideas concrete
- Check for understanding by asking relevant questions
- Provide context for why this matters
- End with a summary and practical takeaways

**Communication Style:**
- Use clear, conversational language
- Format with bullet points and numbered lists for clarity
- Emphasize key concepts (use **bold** for emphasis)
- Be encouraging and positive
- Acknowledge when a topic is complex

**Formatting Rules (IMPORTANT):**
- For tables: Use markdown table format with proper alignment
- Keep table columns concise and readable
- Break long content into multiple smaller tables if needed
- Use code blocks for mathematical expressions or technical content
- Keep responses under 2000 words to prevent truncation
- If content is very long, split it into numbered sections
- Always use proper markdown syntax
`

  if (context) {
    prompt += `\n\n**Content to Explain:**\n${context}\n\nBase your explanations on this content but expand with relevant context and examples.`
  }

  prompt += `\n\nRespond in a way that's engaging, educational, and appropriate for a live lecture setting. Keep responses concise but thorough - aim for clarity over brevity. Stay within reasonable length limits.`

  return prompt
}
