import { createHybridClient } from "@/lib/supabase/mobile-server"
import { NextResponse } from "next/server"
import { generateLecturerResponse, LECTURER_MODELS } from "@/lib/ai/gemini-live"
import { checkAndUpdateNoteUsage } from "@/lib/usage-guard"

export async function POST(request: Request) {
  try {
    const { question, noteId, noteContext, explanationLevel = "intermediate", lectureId } = await request.json()

    if (!question && !noteContext) {
      return NextResponse.json({ error: "Question or note context required" }, { status: 400 })
    }

    const supabase = await createHybridClient(request)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Usage Guard Check
    const usageCheck = await checkAndUpdateNoteUsage(supabase, user.id, noteId, noteContext)
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
        const noteData = (chunks[0].notes as unknown) as { title: string } | null
        const noteTitle = noteData?.title || "Note"
        context = `Note: ${noteTitle}\n\n${chunks.map((c) => c.chunk_text).join("\n\n")}`
      }
    }

    // Save user message to lecture_messages if lectureId is provided
    if (lectureId) {
      await supabase.from("lecture_messages").insert({
        lecture_id: lectureId,
        sender: "user",
        content: question,
        metadata: {},
      })
    }

    // Try Gemini first (FREE tier)
    try {
      const response = await generateLecturerResponse(question, {
        context: context || "",
        noteContext: context || "",
        explanationLevel,
        model: LECTURER_MODELS.GEMINI_3_5_FLASH_LITE,
      })

      const answerText = response.text

      // Save assistant message to lecture_messages if lectureId is provided
      if (lectureId) {
        await supabase.from("lecture_messages").insert({
          lecture_id: lectureId,
          sender: "assistant",
          content: answerText,
          metadata: { model: "gemini" },
        })
      }

      return NextResponse.json({
        answer: answerText,
        suggestedQuestions: response.suggestedQuestions,
        model: "gemini",
        lectureId: lectureId || null,
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

      // Save assistant message to lecture_messages if lectureId is provided
      if (lectureId) {
        await supabase.from("lecture_messages").insert({
          lecture_id: lectureId,
          sender: "assistant",
          content: result.content,
          metadata: { model: "openrouter" },
        })
      }

      return NextResponse.json({
        answer: result.content,
        suggestedQuestions,
        model: "openrouter",
        lectureId: lectureId || null,
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

**Formatting Rules (CRITICAL - Follow Exactly):**
- Use proper Markdown syntax throughout
- For headings: Use ## for main sections, ### for subsections (ALWAYS include the #)
- For lists: Use proper bullet points with hyphens or numbers on separate lines
- For emphasis: Use **bold** for key terms
- For code: Use backticks \`like this\` for inline code
- For code blocks: Use triple backticks with language identifier
- For mathematical expressions: Use LaTeX with \(...\) for inline math and \[...\] for display math
- For tables: Use proper markdown table format with | separators, each row on its own line
  Example:
  | Header 1 | Header 2 |
  | --- | --- |
  | Cell 1 | Cell 2 |
- Keep table columns concise - break complex tables into smaller ones
- Don't use backslashes \\ for line breaks - use blank lines instead
- Use proper spacing: add blank lines between paragraphs
- Keep responses under 2000 words to prevent truncation
- If content is very long, split it into numbered sections (Part 1, Part 2, etc.)
- For matrices, use LaTeX within \[...\] blocks
- Format external references as: [Title](url)
- NEVER collapse table rows onto a single line
- ALWAYS put each table row on a separate line
`

  if (context) {
    prompt += `\n\n**Content to Explain:**\n${context}\n\nBase your explanations on this content but expand with relevant context and examples.`
  }

  prompt += `\n\nRespond in a way that's engaging, educational, and appropriate for a live lecture setting. Keep responses concise but thorough - aim for clarity over brevity. Stay within reasonable length limits.`

  return prompt
}
