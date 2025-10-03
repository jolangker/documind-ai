import type { DocumentChunk, DocumentEmbedding } from '~~/shared/types/document'

const prompts = {
  answer: {
    strict: `You are an AI specialized in question answering.
            Instructions:
            * Always read the input in the exact format:
              Context: <context> Question: <question>
            * Use the context to answer the question as accurately and concisely as possible.
            * Do **not** include information that is not present in the context.
            * Respond in clear, complete sentences.
            * If the answer cannot be found in the context, respond: The answer is not available in the provided context.`,
    noStrict: `You are an AI specialized in question answering.
              Instructions:
              * Always read the input in the exact format: 
                Context: <context> Question: <question> 
              * First, try to answer using only the provided context. 
              * If the answer is found in the context, respond in clear, complete, and concise sentences. 
              * If the answer is not in the context, you may reference outside knowledge, but you must explicitly state that it comes from outside the provided context (e.g., "Based on external knowledge..."). 
              * Do not mix external knowledge with the context unless clearly marked. 
              * If no answer can be found in either the context or external knowledge, respond: The answer is not available.`
  }
}

export function useLLMService() {
  const createEmbeddings = async (chunks: DocumentChunk[]): Promise<DocumentEmbedding[]> => {
    const res = await createEmbeddingsWrapper(chunks.map(({ content }) => content))
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
                    2. Produce a short, concise, neutral summary in natural prose (3-5 sentences).  
                    3. Suggest up to 3 short, open-ended follow-up questions (1 line each) relevant to the text.  

                    Constraints:  
                    - Never hallucinate information not present in the input.  
                    - Do not use headings or labels like "Summary" or "Questions".  
                    - Keep the output natural and readable, like explaining to a person.`
        },
        {
          role: 'user',
          content: `Here is the text from the PDF: ${text}`
        }
      ]
    })
    return res.output_text
  }

  const questionAnswer = async (query: string, context: string[], strict: boolean) => {
    const stream = await openai.responses.create({
      model: 'gpt-5-nano',
      input: [
        {
          role: 'system',
          content: strict ? prompts.answer.strict : prompts.answer.noStrict
        },
        {
          role: 'user',
          content: `Context: ${context.join('\n')}
                    Question: ${query}`
        }
      ],
      stream: true
    })
    return stream
  }

  return {
    createEmbeddings,
    summarizeText,
    questionAnswer
  }
}
