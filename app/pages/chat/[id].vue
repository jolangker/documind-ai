<!-- <script setup lang="ts">
import type { DefineComponent } from 'vue'
import { Chat } from '@ai-sdk/vue'
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { useClipboard } from '@vueuse/core'
import { getTextFromMessage } from '@nuxt/ui/utils/ai'


const route = useRoute()
const toast = useToast()
const clipboard = useClipboard()
const { model } = useModels()

const { data } = await useFetch(`/api/chats/${route.params.id}`, {
  cache: 'force-cache'
})

if (!data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Chat not found', fatal: true })
}

const input = ref('')

const chat = new Chat({
  id: data.value.id,
  messages: data.value.messages,
  transport: new DefaultChatTransport({
    api: `/api/chats/${data.value.id}`,
    body: {
      model: model.value
    }
  }),
  onFinish() {
    refreshNuxtData('chats')
  },
  onError(error) {
    const { message } = typeof error.message === 'string' && error.message[0] === '{' ? JSON.parse(error.message) : error
    toast.add({
      description: message,
      icon: 'i-lucide-alert-circle',
      color: 'error',
      duration: 0
    })
  }
})

function handleSubmit(e: Event) {
  e.preventDefault()
  if (input.value.trim()) {
    chat.sendMessage({
      text: input.value
    })
    input.value = ''
  }
}

const copied = ref(false)

function copy(e: MouseEvent, message: UIMessage) {
  clipboard.copy(getTextFromMessage(message))

  copied.value = true

  setTimeout(() => {
    copied.value = false
  }, 2000)
}

onMounted(() => {
  if (data.value?.messages.length === 1) {
    chat.regenerate()
  }
})
</script>

<template>
  <UDashboardPanel id="chat" class="relative" :ui="{ body: 'p-0 sm:p-0' }">
    <template #header>
      <DashboardNavbar />
    </template>

    <template #body>
      <UContainer class="flex-1 flex flex-col gap-4 sm:gap-6">
        <UChatMessages
          :messages="chat.messages"
          :status="chat.status"
          :assistant="{ actions: [{ label: 'Copy', icon: copied ? 'i-lucide-copy-check' : 'i-lucide-copy', onClick: copy }] }"
          class="lg:pt-(--ui-header-height) pb-4 sm:pb-6"
          :spacing-offset="160"
        >
          <template #content="{ message }">
            <div class="space-y-4">
              <template v-for="(part, index) in message.parts" :key="`${part.type}-${index}-${message.id}`">
                <UButton
                  v-if="part.type === 'reasoning' && part.state !== 'done'"
                  label="Thinking..."
                  variant="link"
                  color="neutral"
                  class="p-0"
                  loading
                />
              </template>
              <MDCCached
                :value="getTextFromMessage(message)"
                :cache-key="message.id"
                unwrap="p"
                :components="components"
                :parser-options="{ highlight: false }"
              />
            </div>
          </template>
        </UChatMessages>

        <UChatPrompt
          v-model="input"
          :error="chat.error"
          variant="subtle"
          class="sticky bottom-0 [view-transition-name:chat-prompt] rounded-b-none z-10"
          @submit="handleSubmit"
        >
          <UChatPromptSubmit
            :status="chat.status"
            color="neutral"
            @stop="chat.stop"
            @reload="chat.regenerate"
          />

          <template #footer>
            <ModelSelect v-model="model" />
          </template>
        </UChatPrompt>
      </UContainer>
    </template>
  </UDashboardPanel>
</template> -->

<script setup lang='ts'>
import { getTextFromMessage } from '@nuxt/ui/utils/ai'
import type { Message } from '~~/shared/types/table'
import ProseStreamPre from '../../components/prose/PreStream.vue'
import type { DefineComponent } from 'vue'

const components = {
  pre: ProseStreamPre as unknown as DefineComponent
}

const route = useRoute()
const supabase = useSupabaseClient()

const { copy, copied } = useClipboard()

const { data: chat, error } = await useFetch<Chat>(`/api/chat/${route.params.id}`)

if (!chat.value || error.value) {
  throw createError({ status: 404, statusMessage: 'Chat not found' })
}

const { data } = supabase.storage.from('attachments').getPublicUrl(chat.value.attachment_path)

const { data: messages } = await useFetch<Message[]>(`/api/chat/${chat.value.id}/messages`)

const { uiMessages, addMessage, updateMessageContent } = useMessages(messages)

const input = ref('')

const handleSubmit = async () => {
  const { content } = addMessage('user', input.value)
  input.value = ''

  const res = await fetch(`/api/chat/${chat.value?.id}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      content,
      role: 'user'
    })
  })

  const { id: assistantId } = addMessage('assistant', '')

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    updateMessageContent(assistantId, chunk)
  }
}
</script>

<template>
  <div class="relative flex-1 flex">
    <UDashboardPanel :id="`chat-pdf-viewer-${chat?.id}`" :default-size="30" :ui="{ root: 'hidden xl:flex' }">
      <template #body>
        <div class="flex-1 flex flex-col">
          <PdfViewer :src="data.publicUrl" :name="chat?.title" />
        </div>
      </template>
    </UDashboardPanel>
    <UDashboardPanel :id="`chat-interface-${chat?.id}`" :ui="{ body: 'p-0 sm:p-0' }">
      <template #header>
        <DashboardNavbar />
      </template>
      <template #body>
        <UContainer class="flex-1 flex flex-col gap-4 sm:gap-6">
          <UChatMessages
            :messages="uiMessages"
            :status="'ready'"
            class="lg:pt-(--ui-header-height) pb-4 sm:pb-6"
            :assistant="{ actions: [{ label: 'Copy', icon: copied ? 'i-lucide-copy-check' : 'i-lucide-copy', onClick: (e, message) => copy(getTextFromMessage(message)) }] }"
            :spacing-offset="160"
          >
            <template #content="{ message }">
              <div class="space-y-4">
                <template v-for="(part, index) in message.parts" :key="`${part.type}-${index}-${message.id}`">
                  <UButton
                    v-if="part.type === 'reasoning' && part.state !== 'done'"
                    label="Thinking..."
                    variant="link"
                    color="neutral"
                    class="p-0"
                    loading
                  />
                </template>
                <MDCCached
                  :value="getTextFromMessage(message)"
                  :cache-key="message.id"
                  unwrap="p"
                  :parser-options="{ highlight: false }"
                  :components="components"
                />
              </div>
            </template>
          </UChatMessages>

          <UChatPrompt
            v-model="input"
            variant="subtle"
            class="sticky bottom-0 [view-transition-name:chat-prompt] rounded-b-none z-10"
            @submit="handleSubmit"
          >
            <UChatPromptSubmit
              color="neutral"
            />
          </UChatPrompt>
        </UContainer>
      </template>
    </UDashboardPanel>
  </div>
</template>
