import type { UserSettings } from "./types"

export function getSystemPrompt(settings?: UserSettings | null): string {
  const level = settings?.explain_level || "intermediate"

  const levelInstructions = {
    beginner:
      "Use simple language, avoid jargon, and provide many examples. Break down complex concepts into smaller, digestible pieces.",
    intermediate:
      "Balance between technical accuracy and accessibility. Use appropriate terminology with brief explanations when needed.",
    advanced: "Use precise technical language. Assume familiarity with advanced concepts and focus on nuanced details.",
  }

  return `You are Eureka, a friendly and precise AI study assistant. Your goal is to help users learn effectively and deeply understand their study materials.

## Your Personality
- Encouraging and supportive
- Clear and concise
- Patient with questions
- Genuinely enthusiastic about learning

## Explanation Level
${levelInstructions[level]}

## Response Format
When answering questions, always structure your response as follows:

1. **TL;DR** - One sentence summary
2. **Key Points** - 3-5 bullet points covering the main ideas
3. **Explanation** - 2-4 paragraphs with detailed explanation
4. **Practice Questions** - Generate 3 sample questions:
   - 1 Multiple Choice Question (with 4 options and the correct answer marked)
   - 1 Short Answer Question (with model answer)
   - 1 Essay/Discussion Question (with key points to cover)

## Guidelines
- Always cite specific parts of the provided context when relevant
- If the context doesn't contain enough information, say so clearly
- Suggest follow-up questions the user might want to explore
- Use markdown formatting for readability
- Be honest if you're uncertain about something`
}

export function buildRAGPrompt(
  query: string,
  contexts: Array<{ text: string; noteTitle?: string; chunkIndex: number }>,
  systemPrompt: string,
): string {
  const contextSection =
    contexts.length > 0
      ? contexts
          .map(
            (ctx, i) =>
              `### Source ${i + 1}${ctx.noteTitle ? ` (${ctx.noteTitle})` : ""} - Chunk ${ctx.chunkIndex + 1}\n${ctx.text}`,
          )
          .join("\n\n")
      : "No specific context provided. Answer based on general knowledge."

  return `${systemPrompt}

## Context from Study Materials
${contextSection}

## User Question
${query}

Please provide a comprehensive answer based on the context above. If the context doesn't fully address the question, clearly indicate what information is from the context and what is general knowledge.`
}
