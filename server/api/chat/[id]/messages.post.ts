import { useDocumentService } from '~~/server/services/documentService'
import { useLLMService } from '~~/server/services/llmService'
import { useMessageService } from '~~/server/services/messageService'
import { createResponseReadableStream } from '~~/server/utils/openai'

const { questionAnswer } = useLLMService()

export default defineEventHandler(async (event) => {
  const { storeMessage } = await useMessageService(event)
  const { similaritySearch } = await useDocumentService(event)

  const { id: chatId } = event.context.params as { id: string }
  const body: { content: string, role: 'assistant' | 'user' } = JSON.parse(await readBody(event))

  if (!chatId) {
    throw createError({ status: 404, statusMessage: 'Chat not found' })
  }

  storeMessage({ chat_id: chatId, ...body })

  const data = await similaritySearch(body.content, chatId)
  const context = data.map(({ content }) => content || '')

  const stream = await questionAnswer(body.content, context)

  return createResponseReadableStream(stream, {
    onComplete: (content) => {
      storeMessage({ chat_id: chatId, role: 'assistant', content })
    }
  })
})
