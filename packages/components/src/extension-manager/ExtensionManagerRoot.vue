<script setup lang="ts">
import type { ExtensionManagerContext, ExtensionManagerEmits, ExtensionManagerRootProps } from './index.type'
import { provideExtensionManagerContext, useExtensionManager } from './composables'

const props = withDefaults(defineProps<ExtensionManagerRootProps>(), {
  extensions: () => [],
  defaultActiveType: 'mcp',
})

const emit = defineEmits<ExtensionManagerEmits>()
const manager = useExtensionManager(props, emit)
const publicManager: ExtensionManagerContext = {
  activeType: manager.activeType,
  catalog: manager.catalog,
  displayItems: manager.displayItems,
  operationStates: manager.operationStates,
  typeOptions: manager.typeOptions,
  installedItems: manager.installedItems,
  marketItems: manager.marketItems,
  setActiveType: manager.setActiveType,
  isSectionExpanded: manager.isSectionExpanded,
  toggleSection: manager.toggleSection,
  requestAdd: manager.requestAdd,
  requestCreate: manager.requestCreate,
  requestToggle: manager.requestToggle,
  requestDetailOpen: manager.requestDetailOpen,
  requestEdit: manager.requestEdit,
  requestDelete: manager.requestDelete,
  requestToolToggle: manager.requestToolToggle,
  requestRefresh: manager.requestRefresh,
}

provideExtensionManagerContext(manager)
defineExpose(publicManager)
</script>

<template>
  <slot />
</template>
