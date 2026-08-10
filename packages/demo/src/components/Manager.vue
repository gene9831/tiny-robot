<script setup lang="ts">
import type {
  Extension,
  ExtensionIntent,
  ExtensionKind,
  ExtensionOperation,
  ExtensionOperationStatus,
  ExtensionOperationStatusMap,
  ExtensionToolToggleIntent,
  ExtensionToggleIntent,
  McpConfig,
  McpFormPayload,
  McpMetadata,
} from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'
import { computed, ref } from 'vue'
import ExtensionManagerContent from './ExtensionManagerContent.vue'

type DemoExtension = Extension<McpConfig, McpMetadata>

const extensions = ref<DemoExtension[]>([
  {
    id: 'mcp-amap',
    kind: 'mcp',
    name: '高德地图 MCP',
    description: '提供地理编码、路线规划、天气查询等地图工具。',
    tags: ['map', 'official'],
    installed: true,
    config: {
      enabled: true,
      tools: { 'geo-code': { enabled: true } },
    },
    metadata: {
      tools: [{ id: 'geo-code', name: '地理编码' }],
    },
  },
  {
    id: 'mcp-browser',
    kind: 'mcp',
    name: '浏览器控制',
    description: '打开页面、读取内容并执行浏览器交互。',
    tags: ['browser', 'local'],
    installed: true,
    config: { enabled: false },
  },
  {
    id: 'skill-toutiao-search',
    kind: 'skill',
    name: '头条搜索',
    description: '使用头条的搜索功能来阅读或搜索 URL。',
    tags: ['search', 'official'],
    installed: true,
    config: { enabled: true },
  },
  {
    id: 'skill-doc-summary',
    kind: 'skill',
    name: '文档总结',
    description: '对长文档进行摘要、提纲整理和重点提取。',
    tags: ['writing'],
    installed: true,
    config: { enabled: true },
  },
  {
    id: 'mcp-12306',
    kind: 'mcp',
    name: '12306 查询',
    description: '查询车次、余票和站点信息。',
    tags: ['travel'],
    installed: false,
  },
  {
    id: 'mcp-file-system',
    kind: 'mcp',
    name: '文件系统',
    description: '读取、搜索和管理本地文件。',
    tags: ['system'],
    installed: false,
  },
  {
    id: 'skill-translate',
    kind: 'skill',
    name: '翻译专家',
    description: '提供多语言翻译、润色和术语解释。',
    tags: ['writing'],
    installed: false,
  },
  {
    id: 'skill-research',
    kind: 'skill',
    name: '资料调研',
    description: '围绕主题收集资料并输出结构化结论。',
    tags: ['search'],
    installed: false,
  },
])

const operationStates = ref<ExtensionOperationStatusMap>({
  'mcp-file-system': { install: { status: 'pending', progress: 45 } },
  'skill-research': { install: { status: 'error', retryable: true } },
})
const events = ref<string[]>([])
const selectedExtensionId = ref<string>()
const showMcpForm = ref(false)
const activeKind = ref<ExtensionKind>('mcp')

const logEvent = (message: string) => {
  events.value.unshift(`${new Date().toLocaleTimeString()} ${message}`)
  events.value = events.value.slice(0, 8)
}

const waitForOperation = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 400)
  })

const findExtension = (id: string) => extensions.value.find((extension) => extension.id === id)

const selectedMcpExtension = computed(() => {
  const extension = selectedExtensionId.value ? findExtension(selectedExtensionId.value) : undefined

  return extension?.kind === 'mcp' ? extension : undefined
})

const setOperation = (id: string, operation: ExtensionOperation, status: ExtensionOperationStatus) => {
  operationStates.value = {
    ...operationStates.value,
    [id]: {
      ...operationStates.value[id],
      [operation]: status,
    },
  }
}

const handleCreate = (kind: ExtensionKind) => {
  if (kind === 'mcp') {
    showMcpForm.value = true
    return
  }

  logEvent(`自定义添加：${kind}`)
}

const handleInstall = async (intent: ExtensionIntent) => {
  const extension = findExtension(intent.id)
  if (!extension) return

  logEvent(`安装扩展：${extension.name}`)
  setOperation(intent.id, 'install', { status: 'pending', progress: 65 })
  await waitForOperation()
  extensions.value = extensions.value.map((item) =>
    item.id === intent.id && item.kind === intent.kind
      ? { ...item, installed: true, config: { ...item.config, enabled: true } }
      : item,
  )
  setOperation(intent.id, 'install', { status: 'success' })
}

const handleToggle = async (intent: ExtensionToggleIntent) => {
  const extension = findExtension(intent.id)
  if (!extension?.installed || extension.kind !== intent.kind) return

  logEvent(`${intent.enabled ? '启用' : '停用'}扩展：${extension.name}`)
  setOperation(intent.id, 'toggle', { status: 'pending' })
  await waitForOperation()
  extensions.value = extensions.value.map((item) =>
    item.id === intent.id && item.kind === intent.kind
      ? { ...item, config: { ...item.config, enabled: intent.enabled } }
      : item,
  )
  setOperation(intent.id, 'toggle', { status: 'success' })
}

const handleDelete = (intent: ExtensionIntent) => {
  const extension = findExtension(intent.id)
  if (!extension) return

  logEvent(`删除扩展：${extension.name}`)
  extensions.value = extensions.value.filter((item) => item.id !== intent.id)
  if (selectedExtensionId.value === intent.id) selectedExtensionId.value = undefined
}

const handleDetailOpen = (intent: ExtensionIntent) => {
  const extension = findExtension(intent.id)
  if (!extension || extension.kind !== 'mcp' || extension.kind !== intent.kind) return

  selectedExtensionId.value = extension.id
  logEvent(`打开详情：${extension.name}`)
}

const handleToolToggle = (intent: ExtensionToolToggleIntent) => {
  const extension = findExtension(intent.id)
  if (!extension || !extension.installed || extension.kind !== intent.kind) return

  extensions.value = extensions.value.map((item) => {
    if (item.id !== intent.id || item.kind !== intent.kind) return item

    return {
      ...item,
      metadata: {
        ...item.metadata,
      },
      config: {
        ...item.config,
        tools: {
          ...item.config?.tools,
          [intent.toolId]: { enabled: intent.enabled },
        },
      },
    }
  })
  logEvent(`${extension.name}：${intent.enabled ? '启用' : '停用'}工具 ${intent.toolId}`)
}

const handleMcpSubmit = (payload: McpFormPayload) => {
  const name = payload.mode === 'form' ? payload.data.name : '自定义 MCP'
  const description = payload.mode === 'form' ? payload.data.description : '通过 JSON 配置添加的 MCP。'

  extensions.value = [
    ...extensions.value,
    {
      id: `custom-mcp-${Date.now()}`,
      kind: 'mcp',
      name,
      description,
      installed: true,
      config: { enabled: true, tools: {} },
      metadata: { tools: [] },
    },
  ]
  showMcpForm.value = false
  logEvent(`创建扩展：${name}`)
}

const handleKindChange = (kind: ExtensionKind) => {
  activeKind.value = kind
  logEvent(`切换 kind：${kind}`)
}
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
      @create="handleCreate"
      @install="handleInstall"
      @toggle="handleToggle"
      @delete="handleDelete"
      @detail="handleDetailOpen"
      @tool-toggle="handleToolToggle"
    >
      <ExtensionManager.Filter :active-kind="activeKind" @update:active-kind="handleKindChange" />
      <ExtensionManagerContent :active-kind="activeKind" @update:active-kind="handleKindChange" />
    </ExtensionManager.Root>

    <section v-if="selectedMcpExtension" class="extension-manager-demo__panel">
      <h3>{{ selectedMcpExtension.name }} 工具</h3>
      <ExtensionManager.McpDetail :item="selectedMcpExtension" @tool-toggle="handleToolToggle" />
    </section>

    <section v-if="showMcpForm" class="extension-manager-demo__panel">
      <h3>添加 MCP</h3>
      <ExtensionManager.McpForm @submit="handleMcpSubmit" @cancel="showMcpForm = false" />
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
