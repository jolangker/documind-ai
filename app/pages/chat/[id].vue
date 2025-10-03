<script setup lang='ts'>
import { getTextFromMessage } from '@nuxt/ui/utils/ai'
import type { Message } from '~~/shared/types/table'
import ProseStreamPre from '../../components/prose/PreStream.vue'
import type { DefineComponent } from 'vue'
import type { ChatStatus } from 'ai'

const components = {
  pre: ProseStreamPre as unknown as DefineComponent
}

const route = useRoute()
const supabase = useSupabaseClient()

const { copy, copied } = useClipboard()
const status = ref<ChatStatus>('ready')

const { data: chat, error } = await useFetch<Chat>(`/api/chat/${route.params.id}`)

if (!chat.value || error.value) {
  throw createError({ status: 404, statusMessage: 'Chat not found' })
}

const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(chat.value.attachment_path)

const { data: messages, refresh: refreshMessages } = await useFetch<Message[]>(`/api/chat/${chat.value.id}/messages`)

const { event, close, open } = useEventSource(
  `/api/chat/${route.params.id}/event`,
  ['heartbeat', 'summary-ready'],
  {
    immediate: false
  }
)

if (!messages.value?.length) {
  open()
  status.value = 'submitted'
}

watchEffect(() => {
  if (event.value === 'summary-ready') {
    status.value = 'ready'
    refreshMessages()
    close()
  }
})

const { uiMessages, addMessage, updateMessageContent } = useMessages(messages)

const input = ref('')

const handleSubmit = async () => {
  if (status.value !== 'ready') return

  let assistantId: string | null = null

  await useFetchStream(`/api/chat/${chat.value?.id}/messages`, {
    body: {
      content: input.value,
      role: 'user'
    },
    onStart: () => {
      status.value = 'submitted'
      addMessage('user', input.value)
      input.value = ''
    },
    onStream: (chunk: string) => {
      status.value = 'streaming'
      if (!assistantId) {
        const { id } = addMessage('assistant', '')
        assistantId = id
      }
      updateMessageContent(assistantId, chunk)
    },
    onFinish: () => { status.value = 'ready' }
  })
}
</script>

<template>
  <div class="relative flex-1 flex">
    <UDashboardPanel :id="`chat-pdf-viewer-${chat?.id}`" :default-size="30" :ui="{ root: 'hidden xl:flex' }">
      <template #body>
        <div class="flex-1 flex flex-col">
          <PdfViewer :src="publicUrl" :name="chat?.title" />
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
            class="lg:pt-(--ui-header-height) pb-4 sm:pb-6"
            :assistant="{
              actions: [{ label: 'Copy', icon: copied ? 'i-lucide-copy-check' : 'i-lucide-copy', onClick: (e, message) => copy(getTextFromMessage(message)) }],
              icon: 'i-lucide-bot'
            }"
            :spacing-offset="160"
            :status="status"
          >
            <template v-if="!messages?.length && status === 'submitted'" #indicator>
              <UButton
                label="Generating summary..."
                variant="link"
                color="neutral"
                class="p-0"
                loading
              />
            </template>
            <template #content="{ message }">
              <div class="space-y-4">
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
              :status="status"
            />
          </UChatPrompt>
        </UContainer>
      </template>
    </UDashboardPanel>
  </div>
</template>
