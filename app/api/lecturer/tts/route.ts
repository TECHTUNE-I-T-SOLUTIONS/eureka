import { NextResponse } from "next/server"
import { createHybridClient } from "@/lib/supabase/mobile-server"

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY

// Available Gemini Free-tier Live and TTS models in order of priority & speed
const GEMINI_TTS_MODELS = [
  "gemini-3.8-live",
  "gemini-3.8-live-extended-thinking",
  "gemini-3.1-flash-live-preview",
  "gemini-3.8-flash-lite-tts", // Ultra-fast ~1.4s response
  "gemini-3.8-flash-tts", // High fidelity ~2.5s response
  "gemini-3.1-flash-tts-preview",
  "gemini-2.5-flash-preview-tts",
]

// Prebuilt voices available in Gemini
const VALID_VOICES = ["Puck", "Charon", "Kore", "Fenrir", "Aoede"]

function sanitizeTextForSpeech(raw: string): string {
  if (!raw) return ""

  return raw
    // Remove markdown code blocks
    .replace(/```[\s\S]*?```/g, " ")
    // Remove inline code
    .replace(/`([^`]+)`/g, "$1")
    // Remove markdown image/links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove markdown headers #, ##, ###
    .replace(/^#{1,6}\s+/gm, "")
    // Remove bold/italic markers **, *, __, _
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
    // Remove blockquotes >
    .replace(/^>\s+/gm, "")
    // Remove markdown bullet points (- or *)
    .replace(/^[-*+]\s+/gm, "")
    // Remove table lines and pipe symbols
    .replace(/\|/g, " ")
    .replace(/[-:]{3,}/g, " ")
    // Remove LaTeX math delimiters \( \), \[ \], $
    .replace(/\\\(|\\\)|\\\[|\\\]|\$/g, " ")
    // Collapse excess whitespace and newlines
    .replace(/\s+/g, " ")
    .trim()
}

export async function POST(request: Request) {
  try {
    // Optional auth check using hybrid client
    try {
      const supabase = await createHybridClient(request)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        // We still allow TTS if authorized or public, but verify user when possible
      }
    } catch {
      // Non-blocking auth check
    }

    const { text, voice, model } = await request.json()

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    // Select suitable voice
    let voiceName = "Puck"
    if (voice && VALID_VOICES.includes(voice)) {
      voiceName = voice
    } else if (voice === "male") {
      voiceName = "Charon"
    } else if (voice === "female") {
      voiceName = "Kore"
    }

    // Sanitize text to sound clear and conversational
    let cleanText = sanitizeTextForSpeech(text)

    // Keep speech segment conversational and responsive (under 1200 chars for < 2.5s generation)
    if (cleanText.length > 1200) {
      cleanText = cleanText.slice(0, 1150) + "..."
    }

    // 1. Try Gemini TTS Free Tier Models
    if (GEMINI_API_KEY) {
      const candidateModels = model
        ? [model, ...GEMINI_TTS_MODELS.filter((m) => m !== model)]
        : GEMINI_TTS_MODELS

      for (const ttsModel of candidateModels) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${ttsModel}:generateContent?key=${GEMINI_API_KEY}`

          const payload = {
            contents: [
              {
                parts: [{ text: cleanText }],
              },
            ],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName,
                  },
                },
              },
            },
          }

          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })

          if (response.ok) {
            const result = await response.json()
            const inlineData = result.candidates?.[0]?.content?.parts?.[0]?.inlineData

            if (inlineData?.data) {
              const mimeType = inlineData.mimeType || "audio/wav"
              const audioUrl = `data:${mimeType};base64,${inlineData.data}`

              return NextResponse.json({
                audio: audioUrl,
                mimeType,
                voice: voiceName,
                model: ttsModel,
                source: "gemini",
              })
            }
          } else {
            const errData = await response.text()
            console.warn(`Gemini TTS model ${ttsModel} returned error:`, errData)
          }
        } catch (modelErr) {
          console.warn(`Gemini TTS model ${ttsModel} exception:`, modelErr)
        }
      }
    }

    // 2. Fallback to ElevenLabs if configured
    if (ELEVENLABS_API_KEY) {
      try {
        const { ElevenLabsClient } = await import("@elevenlabs/elevenlabs-js")
        const client = new ElevenLabsClient({ apiKey: ELEVENLABS_API_KEY })

        const audio = await client.textToSpeech.convert("JBFqnCBsd6RMkjVDRZzb", {
          text: cleanText.slice(0, 2500),
          modelId: "eleven_multilingual_v2",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
          },
        })

        const chunks: Uint8Array[] = []
        const reader = audio.getReader()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
        }

        const audioBuffer = new Uint8Array(chunks.reduce((acc, c) => acc + c.length, 0))
        let offset = 0
        for (const c of chunks) {
          audioBuffer.set(c, offset)
          offset += c.length
        }

        const base64Audio = Buffer.from(audioBuffer).toString("base64")
        return NextResponse.json({
          audio: `data:audio/mpeg;base64,${base64Audio}`,
          mimeType: "audio/mpeg",
          voice: "ElevenLabs",
          source: "elevenlabs",
        })
      } catch (elevenErr) {
        console.warn("ElevenLabs TTS fallback error:", elevenErr)
      }
    }

    return NextResponse.json(
      { error: "Failed to generate speech using available TTS models." },
      { status: 502 }
    )
  } catch (error) {
    console.error("Lecturer TTS API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
