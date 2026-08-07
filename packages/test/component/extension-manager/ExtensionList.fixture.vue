<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ExtensionItem } from '../../../components/src/extension-manager/index.type'
import ExtensionList from '../../../components/src/extension-manager/components/ExtensionList.vue'

const mode = ref<'content' | 'loading' | 'empty' | 'error'>('content')
const retryCount = ref(0)
const allItems: ExtensionItem[] = [
  { id: 'first', type: 'mcp', name: 'First item' },
  { id: 'second', type: 'skill', name: 'Second item' },
]
const items = computed(() => (mode.value === 'empty' ? [] : allItems))
</script>

<template>
  <button type="button" data-testid="show-content" @click="mode = 'content'">Content</button>
  <button type="button" data-testid="show-loading" @click="mode = 'loading'">Loading</button>
  <button type="button" data-testid="show-empty" @click="mode = 'empty'">Empty</button>
  <button type="button" data-testid="show-error" @click="mode = 'error'">Error</button>

  <ExtensionList
    :items="items"
    :loading="mode === 'loading'"
    :error="mode === 'error' ? new Error('Request failed') : undefined"
    empty-text="Nothing here"
    error-text="Unable to load"
    @retry="retryCount += 1"
  >
    <article v-for="item in items" :key="item.id" data-testid="consumer-item">{{ item.name }}</article>
  </ExtensionList>

  <output data-testid="retry-count">{{ retryCount }}</output>
</template>
