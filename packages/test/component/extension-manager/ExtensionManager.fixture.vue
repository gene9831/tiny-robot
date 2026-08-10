<script setup lang="ts">
import { ref } from 'vue'
import type {
  ExtensionIntent,
  ExtensionInput,
  ExtensionOperationStatusMap,
} from '../../../components/src/extension-manager/index.type'
import ExtensionManager from '../../../components/src/extension-manager/index.vue'

const props = defineProps<{
  activeKind?: string
  defaultActiveKind?: string
  extensions?: ExtensionInput[]
}>()

const defaultExtensions: ExtensionInput[] = [
  { id: 'map', kind: 'mcp', name: 'Map service', installed: true, config: { enabled: true } },
  { id: 'browser', kind: 'mcp', name: 'Browser connector', installed: true, config: { enabled: true } },
  { id: 'summary', kind: 'skill', name: 'Summary skill', installed: true, config: { enabled: true } },
  { id: 'train', kind: 'mcp', name: 'Train service' },
  { id: 'file', kind: 'mcp', name: 'File connector' },
  { id: 'translate', kind: 'skill', name: 'Translate skill' },
]
const extensions = ref<ExtensionInput[]>([...(props.extensions ?? defaultExtensions)])
const operationStates: ExtensionOperationStatusMap = {}
const eventLog = ref<string[]>([])

const logInstall = (intent: ExtensionIntent) => eventLog.value.push(`install:${JSON.stringify(intent)}`)
const logCreate = (kind: string) => eventLog.value.push(`create:${kind}`)
const removeSkillExtensions = () => {
  extensions.value = extensions.value.filter((extension) => extension.kind !== 'skill')
}
const clearExtensions = () => {
  extensions.value = []
}
</script>

<template>
  <ExtensionManager
    :extensions="extensions"
    :operation-states="operationStates"
    :active-kind="props.activeKind"
    :default-active-kind="props.defaultActiveKind"
    @install="logInstall"
    @create="logCreate"
  />

  <div data-testid="catalog">{{ extensions.map((extension) => extension.name).join(',') }}</div>
  <div data-testid="event-log">{{ eventLog.join('|') }}</div>
  <button data-testid="remove-skill" type="button" @click="removeSkillExtensions">Remove skill</button>
  <button data-testid="clear-catalog" type="button" @click="clearExtensions">Clear catalog</button>
</template>
