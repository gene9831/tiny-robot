<script setup lang="ts">
import type {
  Extension,
  ExtensionCardActionEvent,
  ExtensionOperation,
  ExtensionOperationStatus,
  ExtensionOperationStatusMap,
  McpConfig,
  McpMetadata,
} from '@opentiny/tiny-robot'
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
const events = ref<string[]>([])

const installedItems = computed(() => extensions.value.filter((extension) => extension.installed))
const availableItems = computed(() => extensions.value.filter((extension) => !extension.installed))

const logEvent = (message: string) => {
  events.value.unshift(`${new Date().toLocaleTimeString()} ${message}`)
  events.value = events.value.slice(0, 8)
}

const wait = (duration: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, duration)
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

const handleInstall = async (item: DemoExtension) => {
  logEvent(`安装：${item.name}`)

  for (let progress = 0; progress <= 100; progress += 10) {
    setOperation(item.id, 'install', { status: 'pending', progress })
    await wait(100)
  }

  extensions.value = extensions.value.map((extension) =>
    extension.id === item.id
      ? { ...extension, installed: true, config: { ...extension.config, enabled: true } }
      : extension,
  )
  setOperation(item.id, 'install', { status: 'success' })
}

const handleToggle = (item: DemoExtension, enabled: boolean) => {
  logEvent(`${enabled ? '启用' : '停用'}：${item.name}`)
  extensions.value = extensions.value.map((extension) =>
    extension.id === item.id ? { ...extension, config: { ...extension.config, enabled } } : extension,
  )
}

const handleDelete = (item: DemoExtension) => {
  logEvent(`删除：${item.name}`)
  extensions.value = extensions.value.map((extension) =>
    extension.id === item.id ? { ...extension, installed: false, config: undefined } : extension,
  )
}

const handleDetailOpen = (item: DemoExtension) => {
  logEvent(`打开详情：${item.name}`)
}

const handleCardAction = (item: DemoExtension, event: ExtensionCardActionEvent) => {
  if (event.id === 'toggle' && typeof event.checked === 'boolean') {
    handleToggle(item, event.checked)
  } else if (event.id === 'install') {
    handleInstall(item)
  } else if (event.id === 'delete') {
    handleDelete(item)
  }
}
</script>

<template>
  <div class="extension-list-demo">
    <header class="extension-list-demo__header">
      <h2>ExtensionList</h2>
      <p>List 提供布局、列表状态和默认 Card 操作，页面结构与事件处理由外部组合。</p>
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
          <ExtensionManager.Card
            v-for="item in installedItems"
            :key="item.id"
            :item="item"
            @name-click="handleDetailOpen(item)"
            @action="handleCardAction(item, $event)"
          />
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
          <ExtensionManager.Card
            v-for="item in availableItems"
            :key="item.id"
            :item="item"
            @name-click="handleDetailOpen(item)"
            @action="handleCardAction(item, $event)"
          />
        </ExtensionManager.List>
      </section>
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
