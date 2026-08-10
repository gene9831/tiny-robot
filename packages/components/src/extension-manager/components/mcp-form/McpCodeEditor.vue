<script setup lang="ts">
const code = defineModel<string>('code', { required: true })
</script>

<template>
  <label class="tr-mcp-code-editor">
    <span>Configuration</span>
    <textarea v-model="code" aria-label="MCP configuration" rows="12"></textarea>
  </label>
</template>

<style lang="less" scoped>
.tr-mcp-code-editor {
  display: grid;
  gap: 8px;
}

.tr-mcp-code-editor textarea {
  width: 100%;
  min-height: 240px;
  box-sizing: border-box;
  padding: 12px;
  border: 0;
  border-radius: 8px;
  background: var(--tr-page-bg-default, #f5f5f5);
  color: var(--tr-text-primary);
  font-family: monospace;
  resize: vertical;
}
</style>
