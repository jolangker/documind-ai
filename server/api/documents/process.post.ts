import { useChatService } from '~~/server/services/chatService'
import { useDocumentService } from '~~/server/services/documentService'
import { useLLMService } from '~~/server/services/llmService'
import { useMessageService } from '~~/server/services/messageService'
import { publishToChat } from '~~/server/utils/notifier'

const { createEmbeddings, summarizeText } = useLLMService()

export default defineEventHandler(async (event) => {
  const fd = await readFormData(event)
  const { storeChat } = await useChatService(event)
  const { extractTextFromDocument, chunkDocumentText, storeAttachment, storeEmbeddings } = await useDocumentService(event)
  const { storeMessage } = await useMessageService(event)

  const file = fd.get('file') as File | undefined
  if (!file) {
    throw createError({ status: 422, statusMessage: 'file is required' })
  }

  const { text } = await extractTextFromDocument(file)
  const chunks = await chunkDocumentText(text, file.name)

  const { path } = await storeAttachment(file)

  const chatPayload: ChatPayload = {
    attachment_path: path,
    title: file.name
  }

  const chat = await storeChat(chatPayload)

  createEmbeddings(chunks).then((val) => {
    storeEmbeddings(chat.id, val)
  })

  summarizeText(text).then((summary) => {
    storeMessage({ chat_id: chat.id, role: 'assistant', content: summary }).then((message) => {
      if (message) {
        publishToChat(chat.id, 'summary-ready', message)
      }
    })
  })

  return {
    chat
  }
})
