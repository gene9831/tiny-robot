<script setup lang="ts">
import { ref } from 'vue'
import type {
  ExtensionOperationStateMap,
  ExtensionRecord,
  ExtensionType,
} from '../../../components/src/extension-manager/index.type'
import ExtensionManagerRoot from '../../../components/src/extension-manager/ExtensionManagerRoot.vue'
import ExtensionManagerRootConsumer from './ExtensionManagerRootConsumer.fixture.vue'

const extensions = ref<ExtensionRecord[]>([
  { id: 'map', type: 'mcp', name: 'Map service', installation: { enabled: true } },
  { id: 'summary', type: 'skill', name: 'Summary skill', installation: { enabled: true } },
  { id: 'train', type: 'mcp', name: 'Train service' },
  { id: 'translate', type: 'skill', name: 'Translate skill' },
])
const operationStates: ExtensionOperationStateMap = {
  train: {
    install: { phase: 'pending' },
  },
}

const eventLog = ref<string[]>([])

const logType = (type: ExtensionType) => eventLog.value.push(`type:${type}`)

const replaceMarketItem = () => {
  extensions.value = extensions.value.map((item) =>
    item.id === 'train' ? { id: 'flight', type: 'mcp', name: 'Flight service' } : item,
  )
}
</script>

<template>
  <ExtensionManagerRoot :extensions="extensions" :operation-states="operationStates" @type-change="logType">
    <ExtensionManagerRootConsumer />
  </ExtensionManagerRoot>

  <button type="button" data-testid="replace-market-item" @click="replaceMarketItem">Replace market item</button>
  <div data-testid="event-log">{{ eventLog.join('|') }}</div>
</template>
