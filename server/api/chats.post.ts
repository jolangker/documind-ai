import { useChatService } from '../services/chatService'

const { storeChat } = useChatService()

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const body = await readBody(event) as ChatPayload

  const chat = await storeChat({
    ...body,
    profile_id: session.user!.id
  })

  return chat
})
