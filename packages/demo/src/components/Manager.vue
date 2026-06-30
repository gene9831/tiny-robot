<script setup lang="ts">
import type { ExtensionItem, ExtensionType } from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'
import { ref } from 'vue'

const installedExtensions = ref<ExtensionItem[]>([
  {
    id: 'mcp-amap',
    type: 'mcp',
    name: '高德地图 MCP',
    description: '提供地理编码、路线规划、天气查询等地图工具。',
    enabled: true,
    tags: ['map', 'official'],
    metadata: {
      tools: [
        { id: 'geo-code', name: '地理编码', description: '根据地址查询坐标。', enabled: true },
        { id: 'route-plan', name: '路径规划', description: '查询步行、骑行或驾车路线。', enabled: false },
      ],
    },
  },
  {
    id: 'mcp-browser',
    type: 'mcp',
    name: '浏览器控制',
    description: '打开页面、读取内容并执行浏览器交互。',
    enabled: false,
    tags: ['browser', 'local'],
  },
  {
    id: 'skill-toutiao-search',
    type: 'skill',
    name: '头条搜索',
    description: '使用头条的搜索功能来阅读或搜索 URL。',
    enabled: true,
    tags: ['search', 'official'],
  },
  {
    id: 'skill-doc-summary',
    type: 'skill',
    name: '文档总结',
    description: '对长文档进行摘要、提纲整理和重点提取。',
    enabled: true,
    tags: ['writing'],
  },
])

const marketExtensions = ref<ExtensionItem[]>([
  {
    id: 'mcp-12306',
    type: 'mcp',
    name: '12306 查询',
    description: '查询车次、余票和站点信息。',
    tags: ['travel', 'remote'],
    addState: 'idle',
  },
  {
    id: 'mcp-file-system',
    type: 'mcp',
    name: '文件系统',
    description: '读取、搜索和管理本地文件。',
    tags: ['system', 'local'],
    addState: 'loading',
    progress: 45,
  },
  {
    id: 'skill-translate',
    type: 'skill',
    name: '翻译专家',
    description: '提供多语言翻译、润色和术语解释。',
    tags: ['writing', 'recommended'],
    addState: 'idle',
  },
  {
    id: 'skill-research',
    type: 'skill',
    name: '资料调研',
    description: '围绕主题收集资料并输出结构化结论。',
    tags: ['search', 'recommended'],
    addState: 'failed',
  },
])

const events = ref<string[]>([])

const logEvent = (message: string) => {
  events.value.unshift(`${new Date().toLocaleTimeString()} ${message}`)
  events.value = events.value.slice(0, 8)
}

const updateInstalled = (id: string, updater: (item: ExtensionItem) => void) => {
  const item = installedExtensions.value.find((extension) => extension.id === id)
  if (item) updater(item)
}

const updateMarket = (id: string, updater: (item: ExtensionItem) => void) => {
  const item = marketExtensions.value.find((extension) => extension.id === id)
  if (item) updater(item)
}

const handleCreate = (type: ExtensionType) => logEvent(`自定义添加：${type}`)

const handleAdd = (item: ExtensionItem) => {
  logEvent(`添加扩展：${item.name}`)
  updateMarket(item.id, (target) => {
    target.addState = 'loading'
    target.progress = 65
  })
}

const handleToggle = (item: ExtensionItem, enabled: boolean) => {
  logEvent(`${enabled ? '启用' : '停用'}扩展：${item.name}`)
  updateInstalled(item.id, (target) => {
    target.enabled = enabled
  })
}

const handleDelete = (item: ExtensionItem) => {
  logEvent(`删除扩展：${item.name}`)
  installedExtensions.value = installedExtensions.value.filter((extension) => extension.id !== item.id)
}

const handleDetailOpen = (item: ExtensionItem) => logEvent(`打开详情：${item.name}`)
const handleTypeChange = (type: ExtensionType) => logEvent(`切换类型：${type}`)
const handleSearchChange = (query: string, type: ExtensionType) => logEvent(`搜索：${type} / ${query || '(空)'}`)
const handleTagChange = (tag: string, type: ExtensionType) => logEvent(`筛选：${type} / ${tag || '(全部)'}`)
</script>

<template>
  <div class="extension-manager-demo">
    <header class="extension-manager-demo__header">
      <h2>ExtensionManager</h2>
      <p>完整扩展管理器示例，包含类型切换、筛选、搜索和扩展操作。</p>
    </header>

    <ExtensionManager
      :installed-extensions="installedExtensions"
      :market-extensions="marketExtensions"
      :tag-options="[
        { label: '地图', value: 'map' },
        { label: '浏览器', value: 'browser' },
        { label: '搜索', value: 'search' },
        { label: '写作', value: 'writing' },
        { label: '旅行', value: 'travel' },
        { label: '系统', value: 'system' },
        { label: '官方', value: 'official' },
        { label: '推荐', value: 'recommended' },
        { label: '本地', value: 'local' },
        { label: '远程', value: 'remote' },
      ]"
      @extension-create="handleCreate"
      @extension-add="handleAdd"
      @extension-toggle="handleToggle"
      @extension-delete="handleDelete"
      @extension-detail-open="handleDetailOpen"
      @type-change="handleTypeChange"
      @search-change="handleSearchChange"
      @tag-change="handleTagChange"
    />

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
