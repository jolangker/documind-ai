import type { DocumentChunk, DocumentEmbedding } from '~~/shared/types/document'
import { openai } from '../utils/openai'

export function useLLMService() {
  const createEmbeddings = async (chunks: DocumentChunk[]): Promise<DocumentEmbedding[]> => {
    const res = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: chunks.map(({ content }) => content)
    })
    return res.data.map(({ embedding, index }) => ({
      content: chunks[index].content,
      metadata: chunks[index].metadata,
      embedding
    }))
  }

  const summarizeText = async (text: string) => {
    const res = await openai.responses.create({
      model: 'gpt-5-nano',
      input: [
        {
          role: 'system',
          content: `You are an AI assistant specialized in summarization.  
                    Your task:  
                    1. Read parsed PDF text.  
                    2. Produce a short, concise, and neutral summary (max 3-5 sentences).  
                    3. Generate up to 3 open-ended follow-up questions relevant to the text.  

                    Constraints:  
                    - Never hallucinate information not present in the input.  
                    `
        },
        {
          role: 'user',
          content: `Here is the text from the PDF: ${text}`
        }
      ]
    })
    return res.output_text
  }

  return {
    createEmbeddings,
    summarizeText
  }
}
