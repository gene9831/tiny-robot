<script setup lang="ts">
import type {
  ExtensionIntent,
  ExtensionOperationKind,
  ExtensionOperationState,
  ExtensionOperationStateMap,
  ExtensionRecord,
  ExtensionToggleIntent,
  ExtensionType,
} from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'
import { ref } from 'vue'
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

const logEvent = (message: string) => {
  events.value.unshift(`${new Date().toLocaleTimeString()} ${message}`)
  events.value = events.value.slice(0, 8)
}

const waitForOperation = () => new Promise<void>((resolve) => setTimeout(resolve, 400))

const findExtension = (id: string) => extensions.value.find((extension) => extension.id === id)

const setOperation = (id: string, kind: ExtensionOperationKind, state: ExtensionOperationState) => {
  operationStates.value = {
    ...operationStates.value,
    [id]: {
      ...operationStates.value[id],
      [kind]: state,
    },
  }
}

const handleCreate = (type: ExtensionType) => logEvent(`自定义添加：${type}`)

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
  if (extension) logEvent(`打开详情：${extension.name}`)
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
