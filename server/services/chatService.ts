export function useChatService() {
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

  const getChats = async (userId: string) => {
    const { data, error } = await supabase.from('chats')
      .select('*')
      .eq('profile_id', userId)

    if (!data || error) {
      throw createError(error)
    }

    return data
  }

  return {
    storeChat,
    getChats
  }
}
