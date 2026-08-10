<script setup lang="ts">
import { computed } from 'vue'
import type { McpDefinition } from '../../index.type'

const definition = defineModel<McpDefinition>('definition', { required: true })

const headers = computed({
  get: () => JSON.stringify(definition.value.headers, null, 2),
  set: (value: string) => {
    try {
      const parsed = JSON.parse(value) as unknown
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        !Array.isArray(parsed) &&
        Object.values(parsed).every((headerValue) => typeof headerValue === 'string')
      ) {
        definition.value = { ...definition.value, headers: parsed as Record<string, string> }
      }
    } catch {
      // Keep the last valid header map until the user enters a valid JSON object.
    }
  },
})
</script>

<template>
  <div class="tr-mcp-definition-editor">
    <label>
      <span>Name</span>
      <input v-model="definition.name" type="text" />
    </label>
    <label>
      <span>Description</span>
      <textarea v-model="definition.description" rows="3"></textarea>
    </label>
    <fieldset>
      <legend>Transport</legend>
      <label>
        <input v-model="definition.transport" type="radio" value="streamableHttp" />
        Streamable HTTP
      </label>
      <label>
        <input v-model="definition.transport" type="radio" value="sse" />
        SSE
      </label>
    </fieldset>
    <label>
      <span>URL</span>
      <input v-model="definition.url" type="url" />
    </label>
    <label>
      <span>Headers</span>
      <textarea v-model="headers" rows="4"></textarea>
    </label>
  </div>
</template>

<style lang="less" scoped>
.tr-mcp-definition-editor {
  display: grid;
  gap: 16px;
}

.tr-mcp-definition-editor > label,
.tr-mcp-definition-editor fieldset {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  border: 0;
}

.tr-mcp-definition-editor input,
.tr-mcp-definition-editor textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  border: 1px solid var(--tr-border-color-divider, #d9d9d9);
  border-radius: 6px;
  color: var(--tr-text-primary);
  font: inherit;
}

.tr-mcp-definition-editor fieldset label {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}
</style>
