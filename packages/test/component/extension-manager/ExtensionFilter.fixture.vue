<script setup lang="ts">
import { ref } from 'vue'
import type { ExtensionInput } from '../../../components/src/extension-manager/index.type'
import ExtensionManagerRoot from '../../../components/src/extension-manager/ExtensionManagerRoot.vue'
import ExtensionFilter from '../../../components/src/extension-manager/components/ExtensionFilter.vue'
import ExtensionFilterConsumer from './ExtensionFilterConsumer.fixture.vue'

const props = withDefaults(
  defineProps<{
    activeKind?: string
    defaultActiveKind?: string
    kindLabels?: Record<string, string>
  }>(),
  {
    defaultActiveKind: 'skill',
    kindLabels: () => ({ mcp: 'MCP servers', skill: 'Skills', workflow: 'Workflows' }),
  },
)

const extensions = ref<ExtensionInput[]>([
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
  { id: 'workflow', kind: 'workflow', name: 'Workflow builder', tags: ['recommended'] },
])

const filterVisible = ref(false)
const secondFilterVisible = ref(false)
const isDevelopment = import.meta.env.DEV
const eventLog = ref<string[]>([])

const log = (event: string, value: string) => eventLog.value.push(`${event}:${value}`)
const removeSkills = () => {
  extensions.value = extensions.value.filter((item) => item.kind !== 'skill')
}
const emptyCatalog = () => {
  extensions.value = []
}
</script>

<template>
  <button type="button" data-testid="toggle-filter" @click="filterVisible = !filterVisible">Toggle filter</button>
  <button type="button" data-testid="toggle-second-filter" @click="secondFilterVisible = !secondFilterVisible">
    Toggle second filter
  </button>
  <button type="button" data-testid="remove-skills" @click="removeSkills">Remove skills</button>
  <button type="button" data-testid="empty-catalog" @click="emptyCatalog">Empty catalog</button>

  <ExtensionManagerRoot :extensions="extensions">
    <ExtensionFilter
      v-if="filterVisible"
      :active-kind="props.activeKind"
      :default-active-kind="props.defaultActiveKind"
      :kind-labels="props.kindLabels"
      @update:active-kind="log('update:active-kind', $event)"
      @update:query="log('update:query', $event)"
      @update:tag="log('update:tag', $event)"
      @query-change="log('query-change', $event)"
      @tag-change="log('tag-change', $event)"
    />
    <ExtensionFilter v-if="secondFilterVisible" :show-search="false" :show-tag-filter="false" />
    <ExtensionFilterConsumer />
  </ExtensionManagerRoot>

  <div data-testid="event-log">{{ eventLog.join('|') }}</div>
  <div data-testid="is-development">{{ isDevelopment }}</div>
</template>
