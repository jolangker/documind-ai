<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import type { Chat } from '~~/shared/types/table'

const toast = useToast()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const loading = ref(false)

const handleUpload = async (file: File | null | undefined) => {
  if (!file) return

  loading.value = true
  const fd = new FormData()
  fd.append('file', file)

  try {
    const res = await $fetch<{ chat: Chat }>('/api/documents/process', {
      method: 'POST',
      body: fd
    })
    navigateTo(`/chat/${res.chat.id}`)
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error?.statusMessage,
      color: 'error'
    })
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="home" :ui="{ body: 'p-0 sm:p-0' }">
    <template #header>
      <DashboardNavbar />
    </template>

    <template #body>
      <UContainer class="flex-1 flex flex-col justify-center gap-4 sm:gap-6 py-8">
        <template v-if="!loading">
          <div class="text-center">
            <h1 class="text-3xl sm:text-4xl text-highlighted font-bold">
              Unlock Insights from Any PDF
            </h1>
            <p class="text-sm sm:text-base text-highlighted/60 mx-auto">
              Upload your document and start chatting with AI to get answers and summaries.
            </p>
          </div>
          <div class="relative">
            <UFileUpload
              interactive
              label="Drag & drop your PDF here"
              description="Maximum file size: 5 MB"
              class="min-h-48"
              :disabled="!user"
              accept="application/pdf"
              @update:model-value="handleUpload"
            />
            <div v-if="!user" class="absolute inset-0 bg-elevated/10 rounded-lg backdrop-blur-sm grid place-items-center">
              <UButton
                label="Login with Google"
                icon="i-simple-icons-google"
                color="neutral"
                variant="outline"
                @click="supabase.auth.signInWithOAuth({ provider: 'google' })"
              />
            </div>
          </div>
        </template>
        <div v-else class="flex-1 grid place-items-center text-highlighted/70">
          <UIcon name="line-md:uploading-loop" :size="64" />
        </div>

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
