import { useChatService } from '../services/chatService'

export default defineEventHandler(async (event) => {
  const body = await readBody(event) as ChatPayload
  const { storeChat } = await useChatService(event)

  const chat = await storeChat(body)

  return chat
})
