import { NextResponse } from "next/server"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY not set for TTS")
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
    }

    // Note: Gemini API does not currently have a dedicated TTS endpoint
    // The models return text, not audio
    // For TTS functionality, we would need to use a different service
    // or wait for Gemini to add audio output capabilities

    return NextResponse.json({
      error: "Gemini TTS not available",
      details: "The Gemini API currently does not provide text-to-speech capabilities. To add audio playback, consider using: 1) Browser's Web Speech API (built-in, free), 2) A dedicated TTS service like ElevenLabs or OpenAI's TTS API, or 3) Wait for Gemini to add audio output features.",
    }, { status: 501 })
  } catch (error) {
    console.error("TTS error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate audio" },
      { status: 500 },
    )
  }
}
