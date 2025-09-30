import type { User } from '#auth-utils'
import { useChatService } from '~~/server/services/chatService'
import { useDocumentService } from '~~/server/services/documentService'
import { useLLMService } from '~~/server/services/llmService'

const { extractTextFromDocument, chunkDocumentText, storeDocumentEmbeddings } = useDocumentService()
const { createEmbeddings, summarizeText } = useLLMService()
const { storeChat } = useChatService()

export default defineEventHandler(async (event) => {
  const fd = await readFormData(event)
  const { user } = await getUserSession(event) as { user: User }

  const file = fd.get('file') as File | undefined
  if (!file) {
    throw createError({ status: 422, statusMessage: 'file is required' })
  }

  const { text, totalPages } = await extractTextFromDocument(file)
  const chunks = await chunkDocumentText(text, file.name)

  const embeddings = await createEmbeddings(chunks)
  const { fullPath } = await storeDocumentEmbeddings(user!.id!, file, embeddings)

  const { questions, summary } = await summarizeText(text)

  const chatPayload: ChatPayload = {
    attachment_url: fullPath,
    title: file.name,
    profile_id: user.id
  }

  const chat = await storeChat(chatPayload)

  return {
    totalPages,
    questions,
    summary,
    chat
  }
})
