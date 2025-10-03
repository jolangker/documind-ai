import type { UIMessage } from 'ai'
import { formatISO } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'
import type { Message } from '~~/shared/types/table'

export function useMessages(messages: Ref<Message[]>) {
  const uiMessages = computed<UIMessage[]>(() => {
    if (!messages.value) return []
    return messages.value.map(val => ({
      id: val.id,
      role: val.role,
      parts: [
        { type: 'text', text: val.content || '' }
      ]
    }))
  })

  const addMessage = (role: Message['role'], content: string) => {
    const newMessage: Message = {
      id: uuidv4(),
      chat_id: uuidv4(),
      content,
      created_at: formatISO(new Date()),
      profile_id: uuidv4(),
      role,
      processing: false
    }

    messages.value.push(newMessage)
    messages.value = [...messages.value]
    return newMessage
  }

  const updateMessageContent = (messageId: string, content: string) => {
    const messageIdx = messages.value.findIndex(({ id }) => id === messageId)

    if (messages.value[messageIdx]) {
      messages.value[messageIdx].content += content
      messages.value = [...messages.value]
    }
  }

  return {
    uiMessages,
    addMessage,
    updateMessageContent
  }
}
