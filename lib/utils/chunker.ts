import crypto from "crypto"

export interface ChunkResult {
  index: number
  text: string
  hash: string
}

const TARGET_CHUNK_SIZE = 600 // ~600 tokens, roughly 400-800 words
const OVERLAP_RATIO = 0.15 // 15% overlap

export function chunkText(noteId: string, text: string): ChunkResult[] {
  const cleanedText = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  if (!cleanedText) return []

  // Split by paragraphs first
  const paragraphs = cleanedText.split(/\n\n+/)
  const chunks: ChunkResult[] = []
  let currentChunk = ""
  let chunkIndex = 0

  for (const paragraph of paragraphs) {
    const potentialChunk = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph

    // Estimate tokens (rough: 1 token ≈ 4 characters)
    const estimatedTokens = potentialChunk.length / 4

    if (estimatedTokens > TARGET_CHUNK_SIZE && currentChunk) {
      // Save current chunk
      const hash = generateChunkHash(noteId, chunkIndex, currentChunk)
      chunks.push({ index: chunkIndex, text: currentChunk, hash })

      // Start new chunk with overlap
      const overlapLength = Math.floor(currentChunk.length * OVERLAP_RATIO)
      const overlap = currentChunk.slice(-overlapLength)
      currentChunk = overlap ? `${overlap}\n\n${paragraph}` : paragraph
      chunkIndex++
    } else {
      currentChunk = potentialChunk
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    const hash = generateChunkHash(noteId, chunkIndex, currentChunk)
    chunks.push({ index: chunkIndex, text: currentChunk, hash })
  }

  return chunks
}

function generateChunkHash(noteId: string, index: number, text: string): string {
  const truncatedText = text.slice(0, 200)
  return crypto.createHash("sha256").update(`${noteId}:${index}:${truncatedText}`).digest("hex")
}
