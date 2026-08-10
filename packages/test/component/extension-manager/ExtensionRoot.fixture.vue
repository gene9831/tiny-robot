<script setup lang="ts">
import { computed, ref } from 'vue'
import type {
  ExtensionContext,
  ExtensionInput,
  ExtensionOperationStatusMap,
} from '../../../components/src/extension-manager/index.type'
import ExtensionManagerRoot from '../../../components/src/extension-manager/ExtensionManagerRoot.vue'
import ExtensionManagerRootConsumer from './ExtensionManagerRootConsumer.fixture.vue'

const availableWithConfig: ExtensionInput = {
  id: 'train',
  kind: 'mcp',
  name: 'Train service',
  installed: false,
  config: { enabled: true },
}
const extensions = ref<ExtensionInput[]>([
  { id: 'map', kind: 'mcp', name: 'Map service', installed: true, config: { enabled: true } },
  { id: 'summary', kind: 'skill', name: 'Summary skill', installed: true, config: { enabled: false } },
  { id: 'plain-installed', kind: 'mcp', name: 'Plain installed service', installed: true },
  availableWithConfig,
  { id: 'translate', kind: 'skill', name: 'Translate skill' },
])
const operationStates: ExtensionOperationStatusMap = {
  train: {
    install: { status: 'pending' },
  },
}

const eventLog = ref<string[]>([])
const activeKind = ref('mcp')
const expandedSections = ref({
  installed: true,
  available: true,
})
const root = ref<Pick<ExtensionContext, 'displayItems' | 'setActiveKind'>>()

const exposesInternalFilterWriter = computed(() => {
  if (!root.value) return false

  return ['unfilteredDisplayItems', 'setDisplayItems', 'claimFilter'].some((key) => key in root.value!)
})

const logKind = (kind: string) => eventLog.value.push(`kind:${kind}`)
const logActiveKindUpdate = (kind: string) => eventLog.value.push(`active-kind:${kind}`)
const logExpandedSectionsUpdate = (sections: Record<'installed' | 'available', boolean>) => {
  eventLog.value.push(`expanded-sections:${JSON.stringify(sections)}`)
}
const logIntent = (name: string, intent: Record<string, unknown>) => {
  eventLog.value.push(`${name}:${JSON.stringify(intent)}`)
}

const replaceAvailableItem = () => {
  extensions.value = extensions.value.map((item) =>
    item.id === 'train' ? { id: 'flight', kind: 'mcp', name: 'Flight service' } : item,
  )
}

const setExternalActiveKind = () => {
  activeKind.value = 'skill'
}

const setExternalExpandedSections = () => {
  expandedSections.value = { installed: false, available: false }
}

const setExposedActiveKind = () => {
  root.value?.setActiveKind('skill')
}
</script>

<template>
  <ExtensionManagerRoot
    ref="root"
    v-model:active-kind="activeKind"
    v-model:expanded-sections="expandedSections"
    :extensions="extensions"
    :operation-states="operationStates"
    @kind-change="logKind"
    @update:active-kind="logActiveKindUpdate"
    @update:expanded-sections="logExpandedSectionsUpdate"
    @install="logIntent('install', $event)"
    @toggle="logIntent('toggle', $event)"
    @delete="logIntent('delete', $event)"
    @detail="logIntent('detail', $event)"
    @create="eventLog.push(`create:${$event}`)"
    @tool-toggle="logIntent('tool-toggle', $event)"
  >
    <ExtensionManagerRootConsumer />
  </ExtensionManagerRoot>

  <button type="button" data-testid="replace-available-item" @click="replaceAvailableItem">
    Replace available item
  </button>
  <button type="button" data-testid="set-external-active-kind" @click="setExternalActiveKind">Set active kind</button>
  <button type="button" data-testid="set-external-expanded-sections" @click="setExternalExpandedSections">
    Set expanded sections
  </button>
  <button type="button" data-testid="set-exposed-active-kind" @click="setExposedActiveKind">
    Set exposed active kind
  </button>
  <div data-testid="root-public-api">{{ root?.displayItems && root?.setActiveKind ? 'available' : 'unavailable' }}</div>
  <div data-testid="root-internal-filter-writers">{{ exposesInternalFilterWriter ? 'leaked' : 'private' }}</div>
  <div data-testid="source-config-preserved">{{ 'config' in availableWithConfig }}</div>
  <div data-testid="event-log">{{ eventLog.join('|') }}</div>
</template>
