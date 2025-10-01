import { OpenAI } from 'openai'
import type { Stream } from 'openai/core/streaming.mjs'
import type { ResponseStreamEvent } from 'openai/resources/responses/responses.mjs'

const config = useRuntimeConfig()

if (!config.OPENAI_API_KEY) {
  throw createError({ status: 500, statusMessage: 'OpenAI API Key not provided' })
}

export const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY
})

interface CreateResponseReadableStreamOptions {
  onComplete?: (content: string) => void
}

export const createResponseReadableStream = (
  stream: Stream<ResponseStreamEvent>,
  opts?: CreateResponseReadableStreamOptions
) => {
  let content = ''
  const responseStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.type === 'response.output_text.delta') {
            content += chunk.delta
            if (chunk.delta) {
              controller.enqueue(new TextEncoder().encode(chunk.delta))
            }
          } else if (chunk.type === 'response.completed') {
            opts?.onComplete?.(content)
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        controller.close()
      }
    }
  })

  return new Response(responseStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}
