import { serverSupabaseClient } from '#supabase/server'
import type { H3Event } from 'h3'

export async function useChatService(event: H3Event) {
  const supabase = await serverSupabaseClient(event)

  const storeChat = async (payload: ChatPayload) => {
    const { data, error } = await supabase.from('chats')
      .insert(payload)
      .select()
      .single()

    if (!data || error) {
      throw createError(error)
    }

    return data
  }

  const getChats = async () => {
    const { data, error } = await supabase.from('chats')
      .select('*')

    if (!data || error) {
      throw createError(error)
    }

    return data
  }

  const getChat = async (chatId: string) => {
    const { data, error } = await supabase.from('chats')
      .select('*')
      .eq('id', chatId)
      .single()

    if (!data || error) {
      throw createError(error)
    }

    return data
  }

  return {
    storeChat,
    getChats,
    getChat
  }
}
