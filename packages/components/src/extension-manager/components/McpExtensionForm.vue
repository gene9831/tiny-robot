<script setup lang="ts">
import McpAddForm from '../../mcp-add-form'
import type { AddType, McpAddFormData } from '../../mcp-add-form/index.type'
import type { McpExtensionCreatePayload, McpExtensionFormEmits, McpExtensionFormProps } from '../index.type'

const props = defineProps<McpExtensionFormProps>()
const emit = defineEmits<McpExtensionFormEmits>()

const handleConfirm = (type: AddType, data: McpAddFormData | string) => {
  const payload: McpExtensionCreatePayload =
    type === 'form' ? { mode: 'form', data: data as McpAddFormData } : { mode: 'code', data: data as string }

  emit('submit', payload)
}
</script>

<template>
  <McpAddForm v-bind="props" @confirm="handleConfirm" @cancel="emit('cancel')" />
</template>
