<script setup lang="ts">
import type {
  Extension,
  ExtensionCardActionEvent,
  ExtensionCardCustomAction,
  ExtensionCardMoreMenuAction,
  ExtensionCardMoreMenuPlacement,
  ExtensionCardPrimaryAction,
  ExtensionOperationStatus,
  ExtensionOperationStatusMap,
} from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'
import { IconDelete, IconEditPen, IconRefresh } from '@opentiny/tiny-robot-svgs'
import { computed, ref } from 'vue'

const checked = ref(true)
const toggleDisabled = ref(false)
const showToggleAction = ref(true)
const installStatus = ref<ExtensionOperationStatus['status']>('pending')
const progress = ref(45)
const showProgressValue = ref(true)
const installRetryable = ref(true)
const installDisabled = ref(false)
const showInstallAction = ref(true)
const buttonDisabled = ref(false)
const showButtonAction = ref(false)
const customDisabled = ref(false)
const showCustomAction = ref(false)
const moreMenuPlacement = ref<ExtensionCardMoreMenuPlacement>('bottom-end')
const editDisabled = ref(false)
const nameClickable = ref(true)
const events = ref<string[]>([])

const cardItem: Extension = {
  id: 'mcp-amap',
  kind: 'mcp',
  name: '高德地图 MCP',
  description: '提供地理编码、路线规划、天气查询等地图工具。',
  icon: 'https://img.alicdn.com/imgextra/i4/O1CN01iPPabT1EGRN6uatHP_!!6000000000324-0-tps-512-512.jpg',
  installed: true,
  config: { enabled: checked.value },
}

const installPreviewItem: Extension = {
  id: 'install-preview',
  kind: 'skill',
  name: '安装状态预览',
  description: 'List 从 Root 的外部 operationStates 投影安装状态。',
  installed: false,
}

const operationStates = computed<ExtensionOperationStatusMap>(() => ({
  [installPreviewItem.id]: {
    install: {
      status: installStatus.value,
      progress: installStatus.value === 'pending' && showProgressValue.value ? progress.value : undefined,
      retryable: installStatus.value === 'error' ? installRetryable.value : undefined,
    },
  },
}))

const primaryActions = computed<ExtensionCardPrimaryAction[]>(() => {
  return [
    {
      id: 'switch',
      type: 'toggle',
      checked: checked.value,
      hidden: !showToggleAction.value,
      disabled: toggleDisabled.value,
      ariaLabel: checked.value ? '停用扩展' : '启用扩展',
    },
    {
      id: 'install',
      type: 'install',
      hidden: !showInstallAction.value,
      disabled: installDisabled.value,
      label: '安装',
      ariaLabel: '安装扩展',
    },
    {
      id: 'configure',
      type: 'button',
      label: '配置',
      icon: IconEditPen,
      hidden: !showButtonAction.value,
      disabled: buttonDisabled.value,
      ariaLabel: '配置扩展',
    },
    {
      id: 'status',
      type: 'custom',
      hidden: !showCustomAction.value,
      disabled: customDisabled.value,
      ariaLabel: '查看扩展状态',
      data: {
        label: '运行正常',
      },
    },
  ]
})

const moreMenuActions = computed<ExtensionCardMoreMenuAction[]>(() => {
  return [
    {
      id: 'edit',
      label: '编辑',
      icon: IconEditPen,
      disabled: editDisabled.value,
    },
    {
      id: 'refresh',
      label: '刷新',
      icon: IconRefresh,
    },
    {
      id: 'delete',
      label: '删除',
      icon: IconDelete,
      danger: true,
    },
  ]
})

const logEvent = (message: string) => {
  events.value.unshift(`${new Date().toLocaleTimeString()} ${message}`)
  events.value = events.value.slice(0, 8)
}

const handleInstallPreview = () => {
  installStatus.value = 'pending'
  logEvent('安装状态预览 → pending')
}

const getCustomActionLabel = (action: ExtensionCardCustomAction) => {
  return (action.data as { label?: string } | undefined)?.label ?? action.id
}

const handleAction = (event: ExtensionCardActionEvent) => {
  if (event.id === 'switch' && typeof event.checked === 'boolean') {
    checked.value = event.checked
    logEvent(`${event.id} → ${event.checked}`)
  } else if (event.id === 'status') {
    logEvent(`${event.id} → ${JSON.stringify(event.payload)}`)
  } else {
    logEvent(event.id)
  }
}
</script>

<template>
  <div class="extension-card-demo">
    <header class="extension-card-demo__header">
      <h2>ExtensionCard</h2>
      <p>primaryActions 支持多个内置或自定义操作，moreMenuActions 通过统一菜单承载次级操作。</p>
    </header>

    <section class="card-playground">
      <form class="card-playground__form">
        <strong>toggle action</strong>
        <label class="card-playground__checkbox">
          <input v-model="showToggleAction" type="checkbox" />
          show action
        </label>
        <label class="card-playground__checkbox">
          <input v-model="checked" type="checkbox" />
          checked
        </label>
        <label class="card-playground__checkbox">
          <input v-model="toggleDisabled" type="checkbox" />
          disabled
        </label>

        <strong>install action</strong>
        <label class="card-playground__checkbox">
          <input v-model="showInstallAction" type="checkbox" />
          show action
        </label>
        <label>
          external status
          <select v-model="installStatus">
            <option value="pending">pending</option>
            <option value="success">success</option>
            <option value="error">error</option>
          </select>
        </label>
        <label>
          progress
          <input
            v-model.number="progress"
            type="number"
            min="0"
            max="100"
            :disabled="installStatus !== 'pending' || !showProgressValue"
          />
        </label>
        <label class="card-playground__checkbox">
          <input v-model="showProgressValue" type="checkbox" />
          determinate progress
        </label>
        <label class="card-playground__checkbox">
          <input v-model="installDisabled" type="checkbox" />
          disabled
        </label>
        <label class="card-playground__checkbox">
          <input v-model="installRetryable" type="checkbox" />
          retryable error
        </label>

        <strong>button action</strong>
        <label class="card-playground__checkbox">
          <input v-model="showButtonAction" type="checkbox" />
          show action
        </label>
        <label class="card-playground__checkbox">
          <input v-model="buttonDisabled" type="checkbox" />
          disabled
        </label>

        <strong>custom action slot</strong>
        <label class="card-playground__checkbox">
          <input v-model="showCustomAction" type="checkbox" />
          show action
        </label>
        <label class="card-playground__checkbox">
          <input v-model="customDisabled" type="checkbox" />
          disabled
        </label>

        <strong>more action</strong>
        <label>
          placement
          <select v-model="moreMenuPlacement">
            <option value="bottom-end">bottom-end</option>
            <option value="top-end">top-end</option>
          </select>
        </label>
        <label class="card-playground__checkbox">
          <input v-model="editDisabled" type="checkbox" />
          edit item disabled
        </label>

        <strong>card</strong>
        <label class="card-playground__checkbox">
          <input v-model="nameClickable" type="checkbox" />
          nameClickable
        </label>
      </form>

      <ExtensionManager.Root :extensions="[cardItem, installPreviewItem]" :operation-states="operationStates">
        <div class="card-playground__preview">
          <div class="card-playground__preview-group">
            <div class="card-playground__preview-title">
              toggle + install + button + custom slot + more menu + unified action event
            </div>
            <ExtensionManager.Card
              :item="cardItem"
              :primary-actions="primaryActions"
              :more-menu-actions="moreMenuActions"
              :more-menu-placement="moreMenuPlacement"
              more-menu-trigger-aria-label="更多扩展操作"
              :name-clickable="nameClickable"
              @name-click="logEvent('打开详情：高德地图 MCP')"
              @action="handleAction"
            >
              <template #custom-action="{ action, trigger }">
                <button
                  class="custom-status-action"
                  type="button"
                  :disabled="action.disabled"
                  :aria-label="action.ariaLabel"
                  @click="trigger({ origin: 'custom-status' })"
                >
                  {{ getCustomActionLabel(action) }}
                </button>
              </template>
            </ExtensionManager.Card>
          </div>

          <div class="card-playground__preview-group">
            <div class="card-playground__preview-title">List + Card 从 Root 投影外部安装状态</div>
            <ExtensionManager.List scope="available" :items="[installPreviewItem]">
              <ExtensionManager.Card
                :item="installPreviewItem"
                :primary-actions="showInstallAction ? undefined : []"
                @action="handleInstallPreview"
              />
            </ExtensionManager.List>
          </div>
        </div>
      </ExtensionManager.Root>
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
.extension-card-demo {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
}

.extension-card-demo__header {
  margin-bottom: 20px;
}

.extension-card-demo__header h2 {
  margin: 0 0 8px;
  color: #1f2937;
  font-size: 24px;
}

.extension-card-demo__header p {
  margin: 0;
  color: #667085;
}

.card-playground {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 20px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
}

.card-playground__form {
  display: grid;
  gap: 12px;
  align-content: start;
}

.card-playground__form strong {
  margin-top: 4px;
  color: #1f2937;
  font-size: 13px;
}

.card-playground__form label {
  display: grid;
  gap: 6px;
  color: #344054;
  font-size: 13px;
}

.card-playground__form select {
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d0d5dd;
  border-radius: 6px;
}

.card-playground__form input[type='number'] {
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d0d5dd;
  border-radius: 6px;
}

.card-playground__checkbox {
  display: flex !important;
  align-items: center;
  gap: 8px !important;
}

.card-playground__preview {
  display: grid;
  gap: 16px;
  min-width: 0;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.card-playground__preview-group {
  display: grid;
  align-items: center;
  gap: 8px;
}

.card-playground__preview-title {
  color: #667085;
  font-size: 13px;
  font-weight: 600;
}

.custom-status-action {
  height: 30px;
  padding: 0 10px;
  border: 0;
  border-radius: 999px;
  background: #ecfdf3;
  color: #027a48;
  cursor: pointer;
  font-size: 12px;
}

.custom-status-action:disabled {
  cursor: not-allowed;
  opacity: 0.5;
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

@media (max-width: 760px) {
  .card-playground {
    grid-template-columns: 1fr;
  }
}
</style>
