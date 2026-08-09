<script setup lang="ts">
import { ref } from 'vue'
import McpExtensionForm from '../../../components/src/extension-manager/components/McpExtensionForm.vue'
import type { McpExtensionCreatePayload } from '../../../components/src/extension-manager/index.type'

const formPayload = ref<McpExtensionCreatePayload>()
const codePayload = ref<McpExtensionCreatePayload>()
const cancelCount = ref(0)

const formData = {
  name: 'Documentation MCP',
  description: 'Provides documentation tools.',
  type: 'streamableHttp' as const,
  url: 'https://example.com/mcp',
  headers: '{"authorization":"Bearer token"}',
  thumbnail: null,
}
</script>

<template>
  <section data-testid="form-adapter">
    <McpExtensionForm :form-data="formData" @submit="formPayload = $event" @cancel="cancelCount += 1" />
  </section>

  <section data-testid="code-adapter">
    <McpExtensionForm
      add-type="code"
      code-data='{"name":"Code MCP"}'
      @submit="codePayload = $event"
      @cancel="cancelCount += 1"
    />
  </section>

  <output data-testid="form-payload">{{ JSON.stringify(formPayload) }}</output>
  <output data-testid="code-payload">{{ JSON.stringify(codePayload) }}</output>
  <output data-testid="cancel-count">{{ cancelCount }}</output>
</template>
