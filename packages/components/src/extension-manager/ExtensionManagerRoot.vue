<script setup lang="ts">
import type { ExtensionManagerEmits, ExtensionManagerRootProps } from './index.type'
import { provideExtensionManagerContext, useExtensionManager } from './composables'

const props = withDefaults(defineProps<ExtensionManagerRootProps>(), {
  extensions: () => [],
  defaultActiveType: 'mcp',
})

const emit = defineEmits<ExtensionManagerEmits>()
const manager = useExtensionManager(props, emit)

provideExtensionManagerContext(manager)
defineExpose(manager)
</script>

<template>
  <slot />
</template>
