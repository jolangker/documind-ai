<script setup lang="ts">
import type { Chat } from '~~/shared/types/table'

const user = useSupabaseUser()

const handleUpload = async (file: File | null | undefined) => {
  if (!file) return
  const fd = new FormData()
  fd.append('file', file)

  try {
    const res = await $fetch<{ chat: Chat }>('/api/documents/process', {
      method: 'POST',
      body: fd
    })
    navigateTo(`/chat/${res.chat.id}`)
  } catch (error) {
    console.error(error)
  }
  // const res = await $fetch('/api/documents/process', {
  // method: 'POST'
  // })

  // refreshNuxtData('chats')
  // navigateTo(`/chat/${res?.chat?.id}`)
}
</script>

<template>
  <UDashboardPanel id="home" :ui="{ body: 'p-0 sm:p-0' }">
    <template #header>
      <DashboardNavbar />
    </template>

    <template #body>
      <UContainer class="flex-1 flex flex-col justify-center gap-4 sm:gap-6 py-8">
        <div class="text-center">
          <h1 class="text-3xl sm:text-4xl text-highlighted font-bold">
            Unlock Insights from Any PDF
          </h1>
          <p class="text-sm sm:text-base text-highlighted/60 mx-auto">
            Upload your document and start chatting with AI to get answers, summaries, and more.
          </p>
        </div>
        <UFileUpload
          interactive
          label="Drop your pdf file here"
          description="only accept PDF file"
          class="min-h-48"
          :disabled="!user"
          accept="application/pdf"
          @update:model-value="handleUpload"
        />
        <!-- <UChatPrompt
          v-model="input"
          :status="loading ? 'streaming' : 'ready'"
          class="[view-transition-name:chat-prompt]"
          variant="subtle"
          @submit="onSubmit"
        >
          <UChatPromptSubmit color="neutral" />

          <template #footer>
            <ModelSelect v-model="model" />
          </template>
        </UChatPrompt> -->
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
