<script setup lang="ts">
import { ref } from 'vue'
import type { ExtensionInput } from '../../../components/src/extension-manager/index.type'
import ExtensionManagerRoot from '../../../components/src/extension-manager/ExtensionManagerRoot.vue'
import ExtensionFilter from '../../../components/src/extension-manager/components/ExtensionFilter.vue'
import ExtensionFilterConsumer from './ExtensionFilterConsumer.fixture.vue'

const extensions: ExtensionInput[] = [
  { id: 'map', kind: 'mcp', name: 'Map service', tags: ['travel', 'maps'], installed: true, config: { enabled: true } },
  {
    id: 'summary',
    kind: 'skill',
    name: 'Summary skill',
    tags: ['writing'],
    installed: true,
    config: { enabled: true },
  },
  { id: 'train', kind: 'mcp', name: 'Train service', tags: ['travel'] },
  { id: 'translate', kind: 'skill', name: 'Translate skill', tags: ['recommended'] },
  { id: 'research', kind: 'skill', name: 'Research skill', tags: ['search', 'recommended'] },
]

const filterVisible = ref(false)
const secondFilterVisible = ref(false)
const isDevelopment = import.meta.env.DEV
const query = ref('')
const tag = ref('')
const eventLog = ref<string[]>([])

const logQuery = (value: string) => eventLog.value.push(`query:${value}`)
const logTag = (value: string) => eventLog.value.push(`tag:${value}`)
</script>

<template>
  <button type="button" data-testid="toggle-filter" @click="filterVisible = !filterVisible">Toggle filter</button>
  <button type="button" data-testid="toggle-second-filter" @click="secondFilterVisible = !secondFilterVisible">
    Toggle second filter
  </button>

  <ExtensionManagerRoot :extensions="extensions">
    <ExtensionFilter
      v-if="filterVisible"
      v-model:query="query"
      v-model:tag="tag"
      @query-change="logQuery"
      @tag-change="logTag"
    />
    <ExtensionFilter v-if="secondFilterVisible" :show-search="false" :show-tag-filter="false" />
    <ExtensionFilterConsumer />
  </ExtensionManagerRoot>

  <div data-testid="event-log">{{ eventLog.join('|') }}</div>
  <div data-testid="is-development">{{ isDevelopment }}</div>
</template>
