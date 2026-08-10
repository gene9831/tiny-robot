<script setup lang="ts">
import type { ExtensionRootEmits, ExtensionRootProps } from './index.type'
import { provideExtensionContext } from './composables/useExtensionContext'

const props = withDefaults(defineProps<ExtensionRootProps>(), {
  extensions: () => [],
  defaultActiveKind: 'mcp',
})

const emit = defineEmits<ExtensionRootEmits>()
const context = provideExtensionContext(props, emit)

defineExpose(context)
</script>

<template>
  <slot />
</template>
