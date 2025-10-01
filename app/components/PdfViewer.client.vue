<script setup lang='ts'>
import { VuePDF, usePDF } from '@tato30/vue-pdf'
import '@tato30/vue-pdf/style.css'

const props = defineProps<{
  src: string
  name?: string
}>()

const { pdf, pages } = usePDF(props.src)
</script>

<template>
  <div class="flex-1 flex flex-col">
    <div class="bg-elevated p-2 text-sm rounded-t-lg font-medium flex justify-between items-center gap-2">
      <div>{{ name }}</div>
      <div>Total Page: {{ pages }}</div>
    </div>
    <div class="flex-grow basis-0 overflow-y-auto rounded-b-lg border-2 border-t-0 border-default">
      <div class="flex flex-col gap-2">
        <div v-for="page in pages" :key="page" class="border-y border-default overflow-hidden">
          <VuePDF
            :pdf
            :page
            fit-parent
            text-layer
          />
        </div>
      </div>
    </div>
  </div>
</template>
