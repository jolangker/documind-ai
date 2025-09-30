import { useChatService } from '../services/chatService'

const { getChats } = useChatService()

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event)

  const chats = await getChats(user!.id)

  return chats
})
