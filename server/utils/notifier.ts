import type { IncomingMessage, ServerResponse } from 'http'

interface SSEClient {
  res: ServerResponse<IncomingMessage>
  chatId: string
}

const clients = new Map<string, SSEClient[]>() // chatId -> clients

export const subscribeToChat = (chatId: string, res: SSEClient['res']) => {
  if (!clients.has(chatId)) {
    clients.set(chatId, [])
  }
  const client: SSEClient = { res, chatId }
  clients.get(chatId)!.push(client)

  res.socket?.on('close', () => {
    const chatClients = clients.get(chatId)
    if (chatClients) {
      const index = chatClients.findIndex(c => c.res === res)
      if (index > -1) chatClients.splice(index, 1)
      if (chatClients.length === 0) clients.delete(chatId)
    }
  })
}

export const publishToChat = (chatId: string, event: string, data: unknown) => {
  const chatClients = clients.get(chatId)
  if (!chatClients) return
  chatClients.forEach(({ res }) => {
    if (!res.writableEnded) {
      const eventData = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
      res.write(eventData)
    }
  })
}
