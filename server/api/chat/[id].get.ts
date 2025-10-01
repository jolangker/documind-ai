import { useChatService } from '~~/server/services/chatService'

export default defineEventHandler(async (event) => {
  const { getChat } = await useChatService(event)
  const chatId = getRouterParam(event, 'id')

  if (!chatId) {
    throw createError({ status: 404, statusMessage: 'Chat not found' })
  }

  const chat = await getChat(chatId)

  return chat
})
