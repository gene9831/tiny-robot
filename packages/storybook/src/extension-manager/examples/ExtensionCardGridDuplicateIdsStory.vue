<script setup lang="ts">
import type { CardGridItem } from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'
import { ref } from 'vue'

const visible = ref(false)
const items = ref<CardGridItem[]>([
  { id: 'duplicate-initial', name: 'First duplicate' },
  { id: 'duplicate-initial', name: 'Second duplicate' },
])

const replaceItems = () => {
  items.value = [
    { id: 'duplicate-initial', name: 'First duplicate' },
    { id: 'duplicate-initial', name: 'Second duplicate' },
  ]
}

const changeIds = () => {
  items.value = [
    { id: 'duplicate-changed', name: 'First changed duplicate' },
    { id: 'duplicate-changed', name: 'Second changed duplicate' },
  ]
}
</script>

<template>
  <div class="storybook-grid-stack">
    <p>In development, each changed duplicate-id set logs one warning.</p>
    <div class="storybook-grid-controls">
      <button type="button" @click="visible = true">Show duplicates</button>
      <button type="button" @click="replaceItems">Replace with same ids</button>
      <button type="button" @click="changeIds">Change duplicate ids</button>
    </div>
    <ExtensionManager.CardGrid v-if="visible" :items="items" />
  </div>
</template>
