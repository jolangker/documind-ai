import type { H3Event } from 'h3'
import { serverSupabaseClient } from '../utils/supabase'
import type { MessagePayload } from '~~/shared/types/table'

export async function useMessageService(event: H3Event) {
  const supabase = await serverSupabaseClient(event)

  const storeMessage = async (payload: MessagePayload) => {
    const { data, error } = await supabase.from('messages')
      .insert({ chat_id: payload.chat_id, role: payload.role, content: payload.content })
      .select()
      .single()

    if (!data || error) {
      throw createError(error)
    }

    return data
  }

  const getMessages = async (chatId: string) => {
    const { data, error } = await supabase.from('messages')
      .select()
      .eq('chat_id', chatId)

    if (!data || error) {
      throw createError(error)
    }

    return data
  }

  const updateMessage = async (messageId: string, payload: Partial<MessagePayload>) => {
    const { error } = await supabase.from('messages')
      .update(payload)
      .eq('id', messageId)

    if (error) {
      throw createError(error)
    }
  }

  return {
    storeMessage,
    getMessages,
    updateMessage
  }
}
