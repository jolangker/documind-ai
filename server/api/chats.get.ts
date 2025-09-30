import { useChatService } from '../services/chatService'

export default defineEventHandler(async (event) => {
  const { getChats } = await useChatService(event)

  const chats = await getChats()

  return chats
})
