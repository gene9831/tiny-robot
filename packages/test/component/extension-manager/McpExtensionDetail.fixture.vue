<script setup lang="ts">
import { computed, ref } from 'vue'
import McpExtensionDetail from '../../../components/src/extension-manager/components/McpExtensionDetail.vue'
import type { ExtensionRecord } from '../../../components/src/extension-manager/index.type'

const item: ExtensionRecord = {
  id: 'documentation-mcp',
  type: 'mcp',
  name: 'Documentation MCP',
  installation: { enabled: false },
  metadata: {
    tools: [
      { id: 'read-docs', name: 'Read docs', description: 'Read documentation pages.', enabled: true },
      { id: 'search-docs', name: 'Search docs', description: 'Search documentation pages.', enabled: false },
    ],
  },
}

const lastToggle = ref<{ toolId: string; enabled: boolean }>()
const toolStates = computed(() => (item.metadata && 'tools' in item.metadata ? item.metadata.tools : []))
</script>

<template>
  <McpExtensionDetail :item="item" @tool-toggle="(toolId, enabled) => (lastToggle = { toolId, enabled })" />

  <output data-testid="parent-enabled">{{ item.installation?.enabled }}</output>
  <output data-testid="tool-states">{{ JSON.stringify(toolStates) }}</output>
  <output data-testid="last-toggle">{{ JSON.stringify(lastToggle) }}</output>
</template>
