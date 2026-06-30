<script setup lang="ts">
import type { ExtensionItem } from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'
import { ref } from 'vue'

const installedItems = ref<ExtensionItem[]>([
  {
    id: 'mcp-amap',
    type: 'mcp',
    name: '高德地图 MCP',
    description: '提供地理编码、路线规划、天气查询等地图工具。',
    enabled: true,
    tags: ['map', 'official'],
    metadata: {
      tools: [
        { id: 'geo-code', name: '地理编码', disabled: true },
        { id: 'route-plan', name: '路径规划', enabled: false },
        { id: 'weather', name: '天气查询', enabled: true },
      ],
    },
  },
  {
    id: 'skill-doc-summary',
    type: 'skill',
    name: '文档总结',
    description: '对长文档进行摘要、提纲整理和重点提取。',
    enabled: false,
    tags: ['writing'],
  },
])

const marketItems = ref<ExtensionItem[]>([
  {
    id: 'mcp-file-system',
    type: 'mcp',
    name: '文件系统',
    description: '读取、搜索和管理本地文件。',
    tags: ['system', 'local'],
    addState: 'loading',
    progress: 45,
    metadata: {
      tools: [
        { id: 'geo-code', name: '地理编码' },
        { id: 'route-plan', name: '路径规划' },
        // { id: 'weather', name: '天气查询' },
      ],
    },
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

const showInstalledLoading = ref(false)
const showMarketLoading = ref(false)
const events = ref<string[]>([])

const logEvent = (message: string) => {
  events.value.unshift(`${new Date().toLocaleTimeString()} ${message}`)
  events.value = events.value.slice(0, 8)
}

const handleAdd = (item: ExtensionItem) => {
  logEvent(`添加：${item.name}`)
  const target = marketItems.value.find((extension) => extension.id === item.id)
  if (!target) return

  addItem(target)
}

const addItem = async (item: ExtensionItem) => {
  item.addState = 'loading'

  await new Promise((resolve) => setTimeout(resolve, 1000))

  while ((item.progress || 0) < 100) {
    item.progress = (item.progress || 0) + 10

    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  item.addState = 'idle'
  item.progress = undefined
  item.enabled = true
  marketItems.value = marketItems.value.filter((i) => i.id !== item.id)
  installedItems.value = installedItems.value.concat(item)
}

const handleToggle = (item: ExtensionItem, enabled: boolean) => {
  logEvent(`${enabled ? '启用' : '停用'}：${item.name}`)
  const target = installedItems.value.find((extension) => extension.id === item.id)
  if (target) target.enabled = enabled
}

const handleDelete = (item: ExtensionItem) => {
  logEvent(`删除：${item.name}`)
  installedItems.value = installedItems.value.filter((extension) => extension.id !== item.id)
  marketItems.value = marketItems.value.concat(item)
}

const handleDetailOpen = (item: ExtensionItem) => {
  logEvent(`打开详情：${item.name}`)
}
</script>

<template>
  <div class="extension-list-demo">
    <header class="extension-list-demo__header">
      <h2>ExtensionList</h2>
      <p>单独预览列表级状态、source 差异和 Card 事件映射。</p>
    </header>

    <section class="extension-list-demo__controls">
      <label>
        <input v-model="showInstalledLoading" type="checkbox" />
        installed loading
      </label>
      <label>
        <input v-model="showMarketLoading" type="checkbox" />
        market loading
      </label>
    </section>

    <section class="extension-list-demo__section">
      <h3>Installed source</h3>
      <ExtensionManager.List
        :items="installedItems"
        source="installed"
        :loading="showInstalledLoading"
        empty-text="暂无已安装扩展"
        @extension-toggle="handleToggle"
        @extension-delete="handleDelete"
        @extension-detail-open="handleDetailOpen"
      />
    </section>

    <section class="extension-list-demo__section">
      <h3>Market source</h3>
      <ExtensionManager.List
        :items="marketItems"
        source="market"
        :loading="showMarketLoading"
        empty-text="暂无市场扩展"
        @extension-add="handleAdd"
        @extension-detail-open="handleDetailOpen"
      />
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
