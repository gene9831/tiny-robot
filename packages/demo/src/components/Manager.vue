<script setup lang="ts">
import type {
  ExtensionIntent,
  ExtensionOperationKind,
  ExtensionOperationState,
  ExtensionOperationStateMap,
  ExtensionRecord,
  ExtensionToggleIntent,
  ExtensionType,
  McpExtensionCreatePayload,
  McpExtensionMetadata,
} from '@opentiny/tiny-robot'
import { ExtensionManager, McpExtensionDetail, McpExtensionForm } from '@opentiny/tiny-robot'
import { computed, ref } from 'vue'
import ExtensionManagerContent from './ExtensionManagerContent.vue'

const extensions = ref<ExtensionRecord[]>([
  {
    id: 'mcp-amap',
    type: 'mcp',
    name: '高德地图 MCP',
    description: '提供地理编码、路线规划、天气查询等地图工具。',
    tags: ['map', 'official'],
    installation: { enabled: true },
    metadata: {
      tools: [{ id: 'geo-code', name: '地理编码', enabled: true }],
    },
  },
  {
    id: 'mcp-browser',
    type: 'mcp',
    name: '浏览器控制',
    description: '打开页面、读取内容并执行浏览器交互。',
    tags: ['browser', 'local'],
    installation: { enabled: false },
  },
  {
    id: 'skill-toutiao-search',
    type: 'skill',
    name: '头条搜索',
    description: '使用头条的搜索功能来阅读或搜索 URL。',
    tags: ['search', 'official'],
    installation: { enabled: true },
  },
  {
    id: 'skill-doc-summary',
    type: 'skill',
    name: '文档总结',
    description: '对长文档进行摘要、提纲整理和重点提取。',
    tags: ['writing'],
    installation: { enabled: true },
  },
  { id: 'mcp-12306', type: 'mcp', name: '12306 查询', description: '查询车次、余票和站点信息。', tags: ['travel'] },
  { id: 'mcp-file-system', type: 'mcp', name: '文件系统', description: '读取、搜索和管理本地文件。', tags: ['system'] },
  {
    id: 'skill-translate',
    type: 'skill',
    name: '翻译专家',
    description: '提供多语言翻译、润色和术语解释。',
    tags: ['writing'],
  },
  {
    id: 'skill-research',
    type: 'skill',
    name: '资料调研',
    description: '围绕主题收集资料并输出结构化结论。',
    tags: ['search'],
  },
])

const operationStates = ref<ExtensionOperationStateMap>({
  'mcp-file-system': { install: { phase: 'pending', progress: 45 } },
  'skill-research': { install: { phase: 'error' } },
})
const events = ref<string[]>([])
const selectedExtensionId = ref<string>()
const showMcpForm = ref(false)

const logEvent = (message: string) => {
  events.value.unshift(`${new Date().toLocaleTimeString()} ${message}`)
  events.value = events.value.slice(0, 8)
}

const waitForOperation = () => new Promise<void>((resolve) => setTimeout(resolve, 400))

const findExtension = (id: string) => extensions.value.find((extension) => extension.id === id)

const selectedMcpExtension = computed(() => {
  const extension = selectedExtensionId.value ? findExtension(selectedExtensionId.value) : undefined

  return extension?.type === 'mcp' ? (extension as ExtensionRecord<McpExtensionMetadata>) : undefined
})

const setOperation = (id: string, kind: ExtensionOperationKind, state: ExtensionOperationState) => {
  operationStates.value = {
    ...operationStates.value,
    [id]: {
      ...operationStates.value[id],
      [kind]: state,
    },
  }
}

const handleCreate = (type: ExtensionType) => {
  if (type === 'mcp') {
    showMcpForm.value = true
    return
  }

  logEvent(`自定义添加：${type}`)
}

const handleAdd = async (intent: ExtensionIntent) => {
  const extension = findExtension(intent.id)
  if (!extension) return

  logEvent(`添加扩展：${extension.name}`)
  setOperation(intent.id, 'install', { phase: 'pending', progress: 65 })
  await waitForOperation()
  extensions.value = extensions.value.map((item) =>
    item.id === intent.id ? { ...item, installation: { enabled: true } } : item,
  )
  setOperation(intent.id, 'install', { phase: 'success' })
}

const handleToggle = async (intent: ExtensionToggleIntent) => {
  const extension = findExtension(intent.id)
  if (!extension?.installation) return

  logEvent(`${intent.enabled ? '启用' : '停用'}扩展：${extension.name}`)
  setOperation(intent.id, 'toggle', { phase: 'pending' })
  await waitForOperation()
  extensions.value = extensions.value.map((item) =>
    item.id === intent.id && item.installation ? { ...item, installation: { enabled: intent.enabled } } : item,
  )
  setOperation(intent.id, 'toggle', { phase: 'success' })
}

const handleDelete = (intent: ExtensionIntent) => {
  const extension = findExtension(intent.id)
  if (!extension) return

  logEvent(`删除扩展：${extension.name}`)
  extensions.value = extensions.value.filter((item) => item.id !== intent.id)
}

const handleDetailOpen = (intent: ExtensionIntent) => {
  const extension = findExtension(intent.id)
  if (!extension || extension.type !== 'mcp') return

  selectedExtensionId.value = extension.id
  logEvent(`打开详情：${extension.name}`)
}

const handleToolToggle = (toolId: string, enabled: boolean) => {
  const extension = selectedMcpExtension.value
  const tools = extension?.metadata?.tools
  if (!extension || !tools) return

  extensions.value = extensions.value.map((item) => {
    if (item.id !== extension.id) return item

    const metadata = item.metadata as McpExtensionMetadata

    return {
      ...item,
      metadata: {
        ...metadata,
        tools: metadata.tools?.map((tool) => (tool.id === toolId ? { ...tool, enabled } : tool)),
      },
    }
  })
  logEvent(`${extension.name}：${enabled ? '启用' : '停用'}工具 ${toolId}`)
}

const handleMcpSubmit = (payload: McpExtensionCreatePayload) => {
  const name = payload.mode === 'form' ? payload.data.name : '自定义 MCP'
  const description = payload.mode === 'form' ? payload.data.description : '通过 JSON 配置添加的 MCP。'

  extensions.value = [
    ...extensions.value,
    {
      id: `custom-mcp-${Date.now()}`,
      type: 'mcp',
      name,
      description,
      installation: { enabled: true },
      metadata: { tools: [] },
    },
  ]
  showMcpForm.value = false
  logEvent(`创建扩展：${name}`)
}

const handleTypeChange = (type: ExtensionType) => logEvent(`切换类型：${type}`)
</script>

<template>
  <div class="extension-manager-demo">
    <header class="extension-manager-demo__header">
      <h2>ExtensionManager</h2>
      <p>宿主保存统一 catalog 与操作状态；Root、Filter 和内容组件只投影状态并发出 intent。</p>
    </header>

    <ExtensionManager.Root
      :extensions="extensions"
      :operation-states="operationStates"
      @extension-create="handleCreate"
      @extension-add="handleAdd"
      @extension-toggle="handleToggle"
      @extension-delete="handleDelete"
      @extension-detail-open="handleDetailOpen"
      @type-change="handleTypeChange"
    >
      <ExtensionManager.Filter />
      <ExtensionManagerContent />
    </ExtensionManager.Root>

    <section v-if="selectedMcpExtension" class="extension-manager-demo__panel">
      <h3>{{ selectedMcpExtension.name }} 工具</h3>
      <McpExtensionDetail :item="selectedMcpExtension" @tool-toggle="handleToolToggle" />
    </section>

    <section v-if="showMcpForm" class="extension-manager-demo__panel">
      <h3>添加 MCP</h3>
      <McpExtensionForm @submit="handleMcpSubmit" @cancel="showMcpForm = false" />
    </section>

    <section class="event-panel">
      <h3>事件日志</h3>
      <div v-if="events.length" class="event-list">
        <div v-for="event in events" :key="event" class="event-item">{{ event }}</div>
      </div>
      <p v-else>暂无事件。</p>
    </section>
  </div>
</template>

<style scoped>
.extension-manager-demo {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
}

.extension-manager-demo__header {
  margin-bottom: 20px;
}

.extension-manager-demo__header h2 {
  margin: 0 0 8px;
  color: #1f2937;
  font-size: 24px;
}

.extension-manager-demo__header p {
  margin: 0;
  color: #667085;
}

.extension-manager-demo__panel {
  margin-top: 24px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.extension-manager-demo__panel h3 {
  margin: 0 0 12px;
  font-size: 16px;
}

.event-panel {
  margin-top: 24px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fafafa;
}

.event-panel h3 {
  margin: 0 0 12px;
  font-size: 16px;
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.event-item {
  padding: 8px 10px;
  border-radius: 6px;
  background: #fff;
  color: #333;
  font-size: 13px;
}
</style>
