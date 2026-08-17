<script setup lang="ts">
import type {
  ExtensionCardGridActionEvent,
  ExtensionCardGridItem,
  ExtensionCardGridNameClickEvent,
} from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'
import { computed, markRaw, ref } from 'vue'
import { IconSparkles } from '@opentiny/tiny-robot-svgs'

const items: ExtensionCardGridItem[] = [
  {
    id: 'alpha',
    name: 'Alpha extension',
    description: 'Click the Card controls to inspect Grid-wrapped events.',
    actions: [
      { id: 'toggle-alpha', type: 'switch', label: 'Enable Alpha', checked: true },
      { id: 'inspect-alpha', type: 'button', label: 'Inspect Alpha', icon: markRaw(IconSparkles) },
    ],
  },
  {
    id: 'beta',
    name: 'Beta extension',
    description: 'The name click payload includes the Grid item id.',
  },
]

const events = ref<string[]>([])

const eventSummary = computed(() => events.value.join('\n') || 'No Grid event yet.')

const handleAction = (event: ExtensionCardGridActionEvent) => {
  events.value.push(`${event.itemId}:action:${event.action.id}:${event.action.type}:${event.action.checked ?? ''}`)
}

const handleNameClick = (event: ExtensionCardGridNameClickEvent) => {
  events.value.push(`${event.itemId}:name-click`)
}
</script>

<template>
  <div class="storybook-grid-events">
    <ExtensionManager.CardGrid :items="items" @action="handleAction" @name-click="handleNameClick" />
    <pre>{{ eventSummary }}</pre>
  </div>
</template>

<style scoped>
.storybook-grid-events {
  display: grid;
  gap: 14px;
}

.storybook-grid-events pre {
  min-height: 42px;
  margin: 0;
  padding: 10px;
  border-radius: 6px;
  background: #f1f5ff;
  color: #52607a;
  font:
    12px/1.5 ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
  white-space: pre-wrap;
}
</style>
