<script setup lang="ts">
import type { Extension, ExtensionOperationStatusMap, McpConfig, McpMetadata } from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'
import { computed, ref } from 'vue'

type DemoExtension = Extension<McpConfig, McpMetadata>

const extensions = ref<DemoExtension[]>([
  {
    id: 'mcp-amap',
    kind: 'mcp',
    name: '高德地图 MCP',
    description: '提供地理编码、路线规划、天气查询等地图工具。',
    installed: true,
    config: {
      enabled: true,
      tools: {
        'geo-code': { enabled: false },
        'route-plan': { enabled: false },
        weather: { enabled: true },
      },
    },
    tags: ['map', 'official'],
    metadata: {
      tools: [
        { id: 'geo-code', name: '地理编码' },
        { id: 'route-plan', name: '路径规划' },
        { id: 'weather', name: '天气查询' },
      ],
    },
  },
  {
    id: 'skill-doc-summary',
    kind: 'skill',
    name: '文档总结',
    description: '对长文档进行摘要、提纲整理和重点提取。',
    installed: true,
    config: { enabled: false },
    tags: ['writing'],
  },
  {
    id: 'mcp-file-system',
    kind: 'mcp',
    name: '文件系统',
    description: '读取、搜索和管理本地文件。',
    installed: false,
    tags: ['system', 'local'],
    metadata: {
      tools: [
        { id: 'geo-code', name: '地理编码' },
        { id: 'route-plan', name: '路径规划' },
      ],
    },
  },
  {
    id: 'skill-translate',
    kind: 'skill',
    name: '翻译专家',
    description: '提供多语言翻译、润色和术语解释。',
    installed: false,
    tags: ['writing', 'recommended'],
  },
  {
    id: 'skill-research',
    kind: 'skill',
    name: '资料调研',
    description: '围绕主题收集资料并输出结构化结论。',
    installed: false,
    tags: ['search', 'recommended'],
  },
])

const operationStates = ref<ExtensionOperationStatusMap>({
  'mcp-file-system': { install: { status: 'pending', progress: 45 } },
  'skill-research': { install: { status: 'error', retryable: true } },
})
const showInstalledLoading = ref(false)
const showAvailableLoading = ref(false)

const installedItems = computed(() => extensions.value.filter((extension) => extension.installed))
const availableItems = computed(() => extensions.value.filter((extension) => !extension.installed))
</script>

<template>
  <div class="extension-list-demo">
    <header class="extension-list-demo__header">
      <h2>ExtensionList</h2>
      <p>List 提供布局和列表状态；Root/List 到 Card 的组合待 adapter 设计完成后恢复。</p>
    </header>

    <section class="extension-list-demo__controls">
      <label>
        <input v-model="showInstalledLoading" type="checkbox" />
        installed loading
      </label>
      <label>
        <input v-model="showAvailableLoading" type="checkbox" />
        available loading
      </label>
    </section>

    <ExtensionManager.Root :extensions="extensions" :operation-states="operationStates">
      <section class="extension-list-demo__section">
        <h3>Installed scope</h3>
        <ExtensionManager.List
          scope="installed"
          :items="installedItems"
          :loading="showInstalledLoading"
          empty-text="暂无已安装扩展"
        >
          <!-- Root/List Card integration is paused until an Extension-to-Card adapter is designed. -->
        </ExtensionManager.List>
      </section>

      <section class="extension-list-demo__section">
        <h3>Available scope</h3>
        <ExtensionManager.List
          scope="available"
          :items="availableItems"
          :loading="showAvailableLoading"
          empty-text="暂无可用扩展"
        >
          <!-- Root/List Card integration is paused until an Extension-to-Card adapter is designed. -->
        </ExtensionManager.List>
      </section>
    </ExtensionManager.Root>
  </div>
</template>

<style scoped>
.extension-list-demo {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
}

.extension-list-demo__header {
  margin-bottom: 20px;
}

.extension-list-demo__header h2 {
  margin: 0 0 8px;
  color: #1f2937;
  font-size: 24px;
}

.extension-list-demo__header p {
  margin: 0;
  color: #667085;
}

.extension-list-demo__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  padding: 14px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.extension-list-demo__controls label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #344054;
  font-size: 13px;
}

.extension-list-demo__section {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.extension-list-demo__section h3 {
  margin: 0 0 4px;
  font-size: 16px;
}
</style>
