import { useChatService } from '~~/server/services/chatService'

export default defineEventHandler(async (event) => {
  const { deleteChat } = await useChatService(event)
  const { id: chatId } = event.context.params as { id: string }

  if (!chatId) {
    throw createError({ status: 404, statusMessage: 'Chat not found' })
  }

  await deleteChat(chatId)
  return {}
})
