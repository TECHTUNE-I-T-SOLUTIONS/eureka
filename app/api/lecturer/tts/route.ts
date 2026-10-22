import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

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

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-3.8-flash-lite-tts" })

    // Note: Gemini TTS requires a different API call
    // For now, we'll return an error indicating to use browser TTS
    // The TTS endpoint might require different implementation
    return NextResponse.json(
      {
        error: "Gemini TTS requires a different implementation. Using browser TTS instead.",
        useBrowserTTS: true,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("TTS error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate audio", useBrowserTTS: true },
      { status: 500 },
    )
  }
}
