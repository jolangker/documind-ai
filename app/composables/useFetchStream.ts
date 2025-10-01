export interface UseFetchStreamOptions {
  body?: MaybeRef
  onStart?: () => void
  onStream?: (chunk: string) => void
  onFinish?: (content: string) => void
}

export async function useFetchStream(input: string, opts?: UseFetchStreamOptions) {
  const text = ref('')

  const execute = async () => {
    opts?.onStart?.()
    text.value = ''

    const res = await fetch(input, {
      method: 'POST',
      body: opts?.body ? JSON.stringify(opts.body) : undefined
    })

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        opts?.onFinish?.(text.value)
        break
      }
      const chunk = decoder.decode(value, { stream: true })
      text.value += chunk
      opts?.onStream?.(chunk)
    }
  }

  await execute()

  return {
    text
  }
}
