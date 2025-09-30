import { useChatService } from '~~/server/services/chatService'
import { useDocumentService } from '~~/server/services/documentService'
import { useLLMService } from '~~/server/services/llmService'

const { createEmbeddings, summarizeText } = useLLMService()

export default defineEventHandler(async (event) => {
  const { storeChat } = await useChatService(event)
  const { extractTextFromDocument, chunkDocumentText, storeAttachment, storeEmbeddings } = await useDocumentService(event)
  const fd = await readFormData(event)

  const file = fd.get('file') as File | undefined
  if (!file) {
    throw createError({ status: 422, statusMessage: 'file is required' })
  }

  const { text, totalPages } = await extractTextFromDocument(file)
  const chunks = await chunkDocumentText(text, file.name)

  const embeddings = await createEmbeddings(chunks)
  const { fullPath } = await storeAttachment(file)

  const chatPayload: ChatPayload = {
    attachment_path: fullPath,
    title: file.name
  }

  const chat = await storeChat(chatPayload)
  await storeEmbeddings(chat.id, embeddings)

  const { questions, summary } = await summarizeText(text)

  return {
    totalPages,
    questions,
    summary,
    chat
  }
})
