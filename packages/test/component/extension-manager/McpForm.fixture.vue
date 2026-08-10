<script setup lang="ts">
import { ref } from 'vue'
import McpForm from '../../../components/src/extension-manager/components/McpForm.vue'
import type { McpDefinition, McpFormMode, McpFormPayload } from '../../../components/src/extension-manager/index.type'

const mode = ref<McpFormMode>('form')
const formPayload = ref<McpFormPayload>()
const codePayload = ref<McpFormPayload>()
const cancelCount = ref(0)
const definition: McpDefinition = {
  name: 'Docs',
  description: 'Documentation server',
  transport: 'streamableHttp',
  url: 'https://example.test/mcp',
  headers: { Authorization: 'Bearer token' },
}
</script>

<template>
  <section data-testid="form-adapter">
    <McpForm v-model:mode="mode" :definition="definition" @submit="formPayload = $event" @cancel="cancelCount += 1" />
  </section>

  <section data-testid="code-adapter">
    <McpForm mode="code" code='{"name":"Code MCP"}' @submit="codePayload = $event" @cancel="cancelCount += 1" />
  </section>

  <output data-testid="form-payload">{{ JSON.stringify(formPayload) }}</output>
  <output data-testid="code-payload">{{ JSON.stringify(codePayload) }}</output>
  <output data-testid="definition">{{ JSON.stringify(definition) }}</output>
  <output data-testid="mode">{{ mode }}</output>
  <output data-testid="cancel-count">{{ cancelCount }}</output>
</template>
