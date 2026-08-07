<script setup lang="ts">
import { ref } from 'vue'
import type {
  ExtensionIntent,
  ExtensionOperationStateMap,
  ExtensionRecord,
} from '../../../components/src/extension-manager/index.type'
import ExtensionManager from '../../../components/src/extension-manager/index.vue'

const extensions = ref<ExtensionRecord[]>([
  { id: 'map', type: 'mcp', name: 'Map service', installation: { enabled: true } },
  { id: 'browser', type: 'mcp', name: 'Browser connector', installation: { enabled: true } },
  { id: 'summary', type: 'skill', name: 'Summary skill', installation: { enabled: true } },
  { id: 'train', type: 'mcp', name: 'Train service' },
  { id: 'file', type: 'mcp', name: 'File connector' },
  { id: 'translate', type: 'skill', name: 'Translate skill' },
])
const operationStates: ExtensionOperationStateMap = {
  train: { install: { phase: 'idle' } },
}
const eventLog = ref<string[]>([])

const logAdd = (intent: ExtensionIntent) => eventLog.value.push(`add:${JSON.stringify(intent)}`)
</script>

<template>
  <ExtensionManager :extensions="extensions" :operation-states="operationStates" @extension-add="logAdd" />

  <div data-testid="catalog">{{ extensions.map((extension) => extension.name).join(',') }}</div>
  <div data-testid="event-log">{{ eventLog.join('|') }}</div>
</template>
