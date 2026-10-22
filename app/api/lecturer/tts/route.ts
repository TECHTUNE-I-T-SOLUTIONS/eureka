import { NextResponse } from "next/server"
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js"

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY

if (!ELEVENLABS_API_KEY) {
  console.warn("ELEVENLABS_API_KEY not set for TTS")
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: "ElevenLabs API key not configured" }, { status: 500 })
    }

    // Initialize ElevenLabs client
    const client = new ElevenLabsClient({
      apiKey: ELEVENLABS_API_KEY,
    })

    // Generate audio using ElevenLabs TTS
    // Using the specific voice ID provided
    const audio = await client.textToSpeech.convert("JBFqnCBsd6RMkjVDRZzb", {
      text: text,
      modelId: "eleven_multilingual_v2",
      voiceSettings: {
        stability: 0.5,
        similarityBoost: 0.75,
      },
    })

    // Convert the audio stream to a buffer
    const chunks: Uint8Array[] = []
    const reader = audio.getReader()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }

    const audioBuffer = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
    let offset = 0
    for (const chunk of chunks) {
      audioBuffer.set(chunk, offset)
      offset += chunk.length
    }

    // Return the audio as base64
    const base64Audio = Buffer.from(audioBuffer).toString('base64')
    const audioUrl = `data:audio/mpeg;base64,${base64Audio}`

    return NextResponse.json({
      audio: audioUrl,
    })
  } catch (error) {
    console.error("ElevenLabs TTS error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate audio" },
      { status: 500 },
    )
  }
}
