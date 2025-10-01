import { serverSupabaseClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)

  const { id: chatId } = event.context.params as { id: string }
  const body: { content: string, role: 'assistant' | 'user' } = JSON.parse(await readBody(event))

  if (!chatId) {
    throw createError({ status: 404, statusMessage: 'Chat not found' })
  }

  const stream = await openai.responses.create({
    model: 'gpt-5-nano',
    input: body.content,
    stream: true
  })

  let assistantContent = ''

  const responseStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.type === 'response.output_text.delta') {
            const content = chunk.delta
            assistantContent += content
            if (content) {
              controller.enqueue(new TextEncoder().encode(content))
            }
          } else if (chunk.type === 'response.completed') {
            await supabase.from('messages')
              .insert({
                chat_id: chatId,
                role: 'assistant',
                content: assistantContent
              })
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        controller.close()
      }
    }
  })

  await supabase.from('messages')
    .insert({ chat_id: chatId, ...body })
    .select()
    .single()

  // console.log(error)

  return new Response(responseStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
})
