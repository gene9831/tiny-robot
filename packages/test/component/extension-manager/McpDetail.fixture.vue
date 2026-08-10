<script setup lang="ts">
import { ref } from 'vue'
import McpDetail from '../../../components/src/extension-manager/components/McpDetail.vue'
import type {
  Extension,
  ExtensionToolToggleIntent,
  McpConfig,
  McpMetadata,
} from '../../../components/src/extension-manager/index.type'

const item: Extension<McpConfig, McpMetadata> = {
  id: 'documentation-mcp',
  kind: 'mcp',
  name: 'Documentation MCP',
  installed: true,
  config: {
    enabled: false,
    tools: {
      'read-docs': { enabled: true },
      'search-docs': { enabled: false },
    },
  },
  metadata: {
    tools: [
      { id: 'read-docs', name: 'Read docs', description: 'Read documentation pages.' },
      { id: 'search-docs', name: 'Search docs', description: 'Search documentation pages.' },
    ],
  },
}

const lastToggle = ref<ExtensionToolToggleIntent>()

const itemWithoutParentToggle: Extension<McpConfig, McpMetadata> = {
  ...item,
  id: 'passive-mcp',
  config: {
    tools: item.config?.tools,
  },
}
</script>

<template>
  <section data-testid="with-parent-toggle">
    <McpDetail :item="item" @tool-toggle="lastToggle = $event" />
  </section>
  <section data-testid="without-parent-toggle">
    <McpDetail :item="itemWithoutParentToggle" />
  </section>

  <output data-testid="parent-enabled">{{ item.config?.enabled }}</output>
  <output data-testid="tool-preferences">{{ JSON.stringify(item.config?.tools) }}</output>
  <output data-testid="last-toggle">{{ JSON.stringify(lastToggle) }}</output>
</template>
