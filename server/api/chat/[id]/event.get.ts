import { subscribeToChat } from '~~/server/utils/notifier'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ status: 400, statusMessage: 'Chat ID required' })
  }

  // Set SSE headers
  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache')
  setHeader(event, 'Connection', 'keep-alive')
  setHeader(event, 'Access-Control-Allow-Origin', '*') // Adjust for CORS if needed

  // Initial event: connected
  event.node.res.write(`event: connected\ndata: ${JSON.stringify({ chatId: id })}\n\n`)

  // Subscribe this response to the chat
  subscribeToChat(id, event.node.res)

  // Heartbeat every 30s to keep connection alive
  const heartbeat = setInterval(() => {
    if (!event.node.res.writableEnded) {
      event.node.res.write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`)
    }
  }, 30000)

  // Cleanup on end/close
  event.node.res.on('close', () => {
    clearInterval(heartbeat)
  })

  // Keep connection open (no return; event loop handles)
})
