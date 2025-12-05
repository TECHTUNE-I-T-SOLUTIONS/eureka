export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length")
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB)

  if (magnitude === 0) return 0

  return dotProduct / magnitude
}

export function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))

  if (magnitude === 0) return vector

  return vector.map((val) => val / magnitude)
}

export interface RankedChunk {
  id: string
  noteId: string
  chunkIndex: number
  text: string
  similarity: number
}

export function rankChunksBySimilarity(
  queryEmbedding: number[],
  chunks: Array<{ id: string; note_id: string; chunk_index: number; chunk_text: string; embedding: number[] | null }>,
  topK = 5,
): RankedChunk[] {
  const scored = chunks
    .filter((chunk) => chunk.embedding && chunk.embedding.length > 0)
    .map((chunk) => ({
      id: chunk.id,
      noteId: chunk.note_id,
      chunkIndex: chunk.chunk_index,
      text: chunk.chunk_text,
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding!),
    }))
    .sort((a, b) => b.similarity - a.similarity)

  return scored.slice(0, topK)
}
