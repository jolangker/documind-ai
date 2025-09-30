export interface DocumentChunkMetadata {
  source?: string
}

export interface DocumentChunk {
  content: string
  metadata: DocumentChunkMetadata
}

export interface DocumentEmbedding extends DocumentChunk {
  embedding: number[]
}
