import { useMessageService } from '~~/server/services/messageService'
import { createResponseReadableStream } from '~~/server/utils/openai'

export default defineEventHandler(async (event) => {
  const { storeMessage } = await useMessageService(event)

  const { id: chatId } = event.context.params as { id: string }
  const body: { content: string, role: 'assistant' | 'user' } = JSON.parse(await readBody(event))

  if (!chatId) {
    throw createError({ status: 404, statusMessage: 'Chat not found' })
  }

  storeMessage({ chat_id: chatId, ...body })

  const stream = await openai.responses.create({
    model: 'gpt-5-nano',
    input: body.content,
    stream: true
  })

  return createResponseReadableStream(stream, {
    onComplete: (content) => {
      storeMessage({ chat_id: chatId, role: 'assistant', content })
    }
  })
})
