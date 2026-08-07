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
const activeType = ref<ExtensionType>('mcp')
const expandedSections = ref({
  installed: true,
  market: true,
})

const logType = (type: ExtensionType) => eventLog.value.push(`type:${type}`)
const logActiveTypeUpdate = (type: ExtensionType) => eventLog.value.push(`active-type:${type}`)
const logExpandedSectionsUpdate = (sections: Record<'installed' | 'market', boolean>) => {
  eventLog.value.push(`expanded-sections:${JSON.stringify(sections)}`)
}
const logIntent = (name: string, intent: Record<string, unknown>) => {
  eventLog.value.push(`${name}:${JSON.stringify(intent)}`)
}

const replaceMarketItem = () => {
  extensions.value = extensions.value.map((item) =>
    item.id === 'train' ? { id: 'flight', type: 'mcp', name: 'Flight service' } : item,
  )
}

const setExternalActiveType = () => {
  activeType.value = 'skill'
}

const setExternalExpandedSections = () => {
  expandedSections.value = { installed: false, market: false }
}
</script>

<template>
  <ExtensionManagerRoot
    v-model:active-type="activeType"
    v-model:expanded-sections="expandedSections"
    :extensions="extensions"
    :operation-states="operationStates"
    @type-change="logType"
    @update:active-type="logActiveTypeUpdate"
    @update:expanded-sections="logExpandedSectionsUpdate"
    @extension-add="logIntent('add', $event)"
    @extension-toggle="logIntent('toggle', $event)"
    @extension-delete="logIntent('delete', $event)"
    @extension-detail-open="logIntent('detail', $event)"
  >
    <ExtensionManagerRootConsumer />
  </ExtensionManagerRoot>

  <button type="button" data-testid="replace-market-item" @click="replaceMarketItem">Replace market item</button>
  <button type="button" data-testid="set-external-active-type" @click="setExternalActiveType">Set active type</button>
  <button type="button" data-testid="set-external-expanded-sections" @click="setExternalExpandedSections">
    Set expanded sections
  </button>
  <div data-testid="event-log">{{ eventLog.join('|') }}</div>
</template>
