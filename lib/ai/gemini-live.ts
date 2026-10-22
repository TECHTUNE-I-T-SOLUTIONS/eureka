// Gemini Live API utility for Lecturer Mode
// Supports real-time audio interactions with Gemini 3.8 Live and related models

import { GoogleGenerativeAI } from "@google/generative-ai"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY not set. Lecturer mode will not work.")
}

// Initialize Gemini client
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null

export interface LiveSessionConfig {
  model?: string
  context?: string
  noteContext?: string
  explanationLevel?: "beginner" | "intermediate" | "advanced"
}

export interface AudioChunk {
  audioData: ArrayBuffer
  isFinal: boolean
}

export interface LiveResponse {
  text: string
  audioData?: ArrayBuffer
  isFinal: boolean
}

/**
 * Create a live session with Gemini for real-time audio interactions
 * This is a simplified version - full implementation would use WebSocket streaming
 */
export async function createLiveSession(config: LiveSessionConfig = {}) {
  if (!genAI) {
    throw new Error("Gemini API key not configured")
  }

  const model = config.model || LECTURER_MODELS.GEMINI_3_5_FLASH_LITE
  const generativeModel = genAI.getGenerativeModel({ model })

  // Build system prompt for lecturer mode
  const systemPrompt = buildLecturerPrompt(config)

  return {
    model: generativeModel,
    systemPrompt,
    config,
  }
}

/**
 * Process audio input and get response (simplified - would use streaming in production)
 */
export async function processAudioInput(
  session: Awaited<ReturnType<typeof createLiveSession>>,
  audioData: ArrayBuffer,
  transcript?: string,
): Promise<LiveResponse> {
  try {
    // For now, we'll use the transcript if available, otherwise this would require STT
    const inputText = transcript || ""

    if (!inputText) {
      throw new Error("Either audio transcript or text input is required")
    }

    const result = await session.model.generateContent([
      session.systemPrompt,
      inputText,
    ])

    const response = result.response
    const text = response.text()

    // In production, this would also generate audio using TTS
    return {
      text,
      isFinal: true,
    }
  } catch (error) {
    console.error("Error processing audio input:", error)
    throw error
  }
}

/**
 * Generate audio from text using Gemini's multimodal capabilities
 * Gemini can generate audio content through the text-to-speech API
 */
export async function generateAudio(text: string): Promise<ArrayBuffer> {
  if (!genAI) {
    throw new Error("Gemini API key not configured")
  }

  try {
    // Note: Gemini's direct TTS is not fully exposed in the SDK
    // The TTS API route uses REST API which is the correct approach
    throw new Error("Use the TTS API route instead - this function is deprecated")
  } catch (error) {
    console.error("Gemini TTS error:", error)
    throw error
  }
}

/**
 * Alternative: Use browser TTS with enhanced voice selection
 * This is the most reliable free option currently
 */
export async function speakWithBrowserTTS(text: string): Promise<void> {
  if (!window.speechSynthesis) {
    throw new Error("Speech synthesis not supported")
  }

  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1
    utterance.pitch = 1
    utterance.volume = 1

    // Try to get a good voice
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(
      (voice) =>
        voice.lang.includes("en") &&
        (voice.name.includes("Google") || voice.name.includes("Natural") || voice.name.includes("Enhanced")),
    )
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onend = () => resolve()
    utterance.onerror = (e) => reject(e)

    window.speechSynthesis.speak(utterance)
  })
}

/**
 * Get available lecturer models (Free tier models only)
 */
export const LECTURER_MODELS = {
  GEMINI_3_5_FLASH_LITE: "gemini-3.5-flash-lite", // Free on free tier (recommended by Google)
  FALLBACK: "gemini-3.5-flash-lite", // Most cost-effective free option
}

function buildLecturerPrompt(config: LiveSessionConfig): string {
  const { context, noteContext, explanationLevel = "intermediate" } = config

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

**Enhanced Explanations:**
- Go beyond the provided notes - add your own examples and analogies
- Reference real-world applications and industry cases
- Mention relevant books, papers, or authors when appropriate
- Connect concepts to other fields or domains
- Provide historical context or interesting facts
- Suggest further reading or resources when relevant
- Use metaphors and analogies not in the original content
- Explain the "why" behind concepts, not just the "what"

**Communication Style:**
- Use clear, conversational language
- Format with bullet points and numbered lists for clarity
- Emphasize key concepts (you can use **bold** for emphasis)
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

  if (noteContext) {
    prompt += `\n\n**Note Context to Explain:**\n${noteContext}\n\nBase your explanations on this content but EXPAND significantly with additional examples, real-world applications, historical context, and external references. Don't just repeat the notes - enhance them.`
  }

  if (context) {
    prompt += `\n\n**Additional Context:**\n${context}`
  }

  prompt += `\n\nRespond in a way that's engaging, educational, and appropriate for a live lecture setting. Go beyond the provided material to create a truly comprehensive learning experience. Keep responses concise but thorough - aim for clarity over brevity. Stay within reasonable length limits.`

  return prompt
}

/**
 * Generate text response for lecturer mode (non-audio fallback)
 */
export async function generateLecturerResponse(
  question: string,
  config: LiveSessionConfig = {},
): Promise<{ text: string; suggestedQuestions: string[] }> {
  const session = await createLiveSession(config)
  const response = await processAudioInput(session, new ArrayBuffer(0), question)

  // Generate follow-up questions
  const followUpPrompt = `Based on this Q&A, suggest 3 follow-up questions a student might ask to deepen their understanding. Each question should be concise and clear.

Question: ${question}

Answer: ${response.text}

Provide just the questions, one per line, no numbering, no extra text.`

  const followUpResult = await session.model.generateContent([
    session.systemPrompt,
    followUpPrompt,
  ])

  const suggestedQuestions = followUpResult.response
    .text()
    .split("\n")
    .map((q) => q.trim())
    .filter((q) => q.length > 0 && q.length < 200) // Filter out very long questions
    .slice(0, 3)

  return {
    text: response.text,
    suggestedQuestions,
  }
}
