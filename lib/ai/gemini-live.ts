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

  const model = config.model || "gemini-2.5-flash-exp"
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
 * Generate audio from text using Gemini TTS
 */
export async function generateAudio(text: string): Promise<ArrayBuffer> {
  // This would use Gemini's TTS capabilities
  // For now, we'll return a placeholder
  // In production, you'd call the appropriate TTS endpoint
  throw new Error("TTS not yet implemented - use browser's speech synthesis")
}

/**
 * Get available lecturer models
 */
export const LECTURER_MODELS = {
  GEMINI_3_8_LIVE: "gemini-3.8-live",
  GEMINI_3_8_LIVE_EXTENDED: "gemini-3.8-live-extended-thinking",
  GEMINI_3_1_FLASH_LIVE: "gemini-3.1-flash-live-preview",
  GEMINI_3_5_TRANSCRIBE: "gemini-3.5-transcribe-live",
  GEMINI_2_5_FLASH_NATIVE_AUDIO: "gemini-2.5-flash-native-audio-preview-12-2025",
  FALLBACK: "gemini-2.5-flash-exp",
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

**Communication Style:**
- Use clear, conversational language
- Format with bullet points and numbered lists for clarity
- Emphasize key concepts (you can use **bold** for emphasis)
- Be encouraging and positive
- Acknowledge when a topic is complex
`

  if (noteContext) {
    prompt += `\n\n**Note Context to Explain:**\n${noteContext}\n\nBase your explanations on this content but expand with relevant context and examples.`
  }

  if (context) {
    prompt += `\n\n**Additional Context:**\n${context}`
  }

  prompt += `\n\nRespond in a way that's engaging, educational, and appropriate for a live lecture setting. Keep responses concise but thorough - aim for clarity over brevity.`

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
  const followUpPrompt = `Based on this Q&A, suggest 3 follow-up questions a student might ask to deepen their understanding:\n\nQuestion: ${question}\n\nAnswer: ${response.text}\n\nProvide just the questions, one per line, no numbering.`

  const followUpResult = await session.model.generateContent([
    session.systemPrompt,
    followUpPrompt,
  ])

  const suggestedQuestions = followUpResult.response
    .text()
    .split("\n")
    .map((q) => q.trim())
    .filter((q) => q.length > 0)
    .slice(0, 3)

  return {
    text: response.text,
    suggestedQuestions,
  }
}
