<script setup lang="ts">
import type { ExtensionItem } from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'
import { ref } from 'vue'

const expandedSections = ref({
  summary: true,
  list: true,
})

const items = ref<ExtensionItem[]>([
  {
    id: 'mcp-amap',
    type: 'mcp',
    name: '高德地图 MCP',
    description: '提供地理编码、路线规划、天气查询等地图工具。',
    enabled: true,
    tags: ['map', 'official'],
    metadata: {
      tools: [
        { id: 'geo-code', name: '地理编码', enabled: true },
        { id: 'route-plan', name: '路径规划', enabled: false },
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

const events = ref<string[]>([])

const logEvent = (message: string) => {
  events.value.unshift(`${new Date().toLocaleTimeString()} ${message}`)
  events.value = events.value.slice(0, 8)
}

const toggleSummary = () => {
  expandedSections.value.summary = !expandedSections.value.summary
  logEvent(`${expandedSections.value.summary ? '展开' : '收起'}：Summary section`)
}

const toggleList = () => {
  expandedSections.value.list = !expandedSections.value.list
  logEvent(`${expandedSections.value.list ? '展开' : '收起'}：List section`)
}

const handleToggle = (item: ExtensionItem, enabled: boolean) => {
  const target = items.value.find((extension) => extension.id === item.id)
  if (target) target.enabled = enabled
  logEvent(`${enabled ? '启用' : '停用'}：${item.name}`)
}

const handleDelete = (item: ExtensionItem) => {
  items.value = items.value.filter((extension) => extension.id !== item.id)
  logEvent(`删除：${item.name}`)
}

const handleDetailOpen = (item: ExtensionItem) => {
  logEvent(`打开详情：${item.name}`)
}
</script>

<template>
  <div class="extension-section-demo">
    <header class="extension-section-demo__header">
      <h2>ExtensionSection</h2>
      <p>单独预览可折叠 section 容器，以及 slot 承载普通内容和 ExtensionList 的表现。</p>
    </header>

    <div class="extension-section-demo__surface">
      <ExtensionManager.Section title="Summary section" :expanded="expandedSections.summary" @toggle="toggleSummary">
        <div class="extension-section-demo__content">
          <p>ExtensionSection 只负责标题、展开状态和默认 slot，不感知 source、items 或扩展操作。</p>
          <p>父级组件维护 expanded 状态，section 点击标题后只发出 toggle 事件。</p>
        </div>
      </ExtensionManager.Section>

      <ExtensionManager.Section title="List section" :expanded="expandedSections.list" @toggle="toggleList">
        <ExtensionManager.List
          :items="items"
          source="installed"
          empty-text="暂无已安装扩展"
          @extension-toggle="handleToggle"
          @extension-delete="handleDelete"
          @extension-detail-open="handleDetailOpen"
        />
      </ExtensionManager.Section>
    </div>

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
.extension-section-demo {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
}

.extension-section-demo__header {
  margin-bottom: 20px;
}

.extension-section-demo__header h2 {
  margin: 0 0 8px;
  color: #1f2937;
  font-size: 24px;
}

.extension-section-demo__header p {
  margin: 0;
  color: #667085;
}

.extension-section-demo__surface {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.extension-section-demo__content {
  display: grid;
  gap: 8px;
  padding: 12px 0 4px;
  color: #475467;
  font-size: 14px;
}

.extension-section-demo__content p {
  margin: 0;
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
