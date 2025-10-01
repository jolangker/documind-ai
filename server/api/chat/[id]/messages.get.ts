import { serverSupabaseClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)

  const { id: chatId } = event.context.params as { id: string }
  if (!chatId) {
    throw createError({ status: 404, statusMessage: 'Chat not found' })
  }

  const { data: messages } = await supabase.from('messages')
    .select()
    .eq('chat_id', chatId)

  return messages
})
