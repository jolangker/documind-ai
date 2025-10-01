import { useChatService } from '~~/server/services/chatService'
import { useDocumentService } from '~~/server/services/documentService'
import { useLLMService } from '~~/server/services/llmService'

const { createEmbeddings } = useLLMService()

export default defineEventHandler(async (event) => {
  const { storeChat } = await useChatService(event)
  const { extractTextFromDocument, chunkDocumentText, storeAttachment, storeEmbeddings } = await useDocumentService(event)
  const fd = await readFormData(event)

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

  // const { questions, summary } = await summarizeText(text)

  return {
    chat
  }
})
