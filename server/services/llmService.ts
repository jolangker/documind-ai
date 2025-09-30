import type { DocumentChunk, DocumentEmbedding } from '~~/shared/types/document'
import { openai } from '../utils/openai'
import type { SummarizedText } from '~~/shared/types/llm'

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

  const summarizeText = async (text: string): Promise<SummarizedText> => {
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
                    - Always return output as valid JSON.  
                    - Do not include any text outside the JSON object.  
                    - Never hallucinate information not present in the input.  

                    JSON Schema:
                    {
                      "summary": "string, required, a short neutral summary (3-5 sentences max)",
                      "questions": [
                        "string, required, up to 3 open-ended questions relevant to the text, short (10 words max)"
                      ]
                    }`
        },
        {
          role: 'user',
          content: `Here is the text from the PDF: ${text}`
        }
      ],
      text: {
        format: {
          type: 'json_object'
        }
      }
    })
    return JSON.parse(res.output_text) as { summary: string, questions: string[] }
  }

  return {
    createEmbeddings,
    summarizeText
  }
}
