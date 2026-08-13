<script setup lang="ts">
import type {
  ExtensionCardAction,
  ExtensionCardActionEvent,
  ExtensionCardCustomAction,
  ExtensionCardOverflowMenuPlacement,
} from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'
import { IconDelete, IconEditPen, IconRefresh } from '@opentiny/tiny-robot-svgs'
import { computed, ref } from 'vue'

const checked = ref(true)
const toggleDisabled = ref(false)
const showToggleAction = ref(true)
const buttonDisabled = ref(false)
const showButtonAction = ref(false)
const customDisabled = ref(false)
const showCustomAction = ref(false)
const primaryActionsLimit = ref(1)
const overflowMenuPlacement = ref<ExtensionCardOverflowMenuPlacement>('bottom-end')
const editDisabled = ref(false)
const nameClickable = ref(true)
const events = ref<string[]>([])

const actions = computed<ExtensionCardAction[]>(() => [
  {
    id: 'switch',
    type: 'switch',
    label: checked.value ? '停用扩展' : '启用扩展',
    checked: checked.value,
    hidden: !showToggleAction.value,
    disabled: toggleDisabled.value,
  },
  {
    id: 'configure',
    type: 'button',
    label: '配置',
    icon: IconEditPen,
    hidden: !showButtonAction.value,
    disabled: buttonDisabled.value,
  },
  {
    id: 'status',
    type: 'custom',
    label: '查看扩展状态',
    hidden: !showCustomAction.value,
    disabled: customDisabled.value,
    data: { label: '运行正常' },
  },
  { id: 'edit', type: 'button', label: '编辑', icon: IconEditPen, disabled: editDisabled.value },
  { id: 'refresh', type: 'button', label: '刷新', icon: IconRefresh },
  { id: 'delete', type: 'button', label: '删除', icon: IconDelete, danger: true },
])

const logEvent = (message: string) => {
  events.value.unshift(`${new Date().toLocaleTimeString()} ${message}`)
  events.value = events.value.slice(0, 6)
}

const getCustomActionLabel = (action: ExtensionCardCustomAction) => {
  if (typeof action.data === 'object' && action.data !== null && 'label' in action.data) {
    const label = (action.data as { label?: unknown }).label
    if (typeof label === 'string') return label
  }

  return action.label
}

const handleAction = (event: ExtensionCardActionEvent) => {
  if (event.type === 'switch' && event.id === 'switch' && typeof event.checked === 'boolean') {
    checked.value = event.checked
    logEvent(`${event.type} → ${event.checked}`)
    return
  }

  logEvent(`${event.type}: ${event.id}${event.payload !== undefined ? ` → ${JSON.stringify(event.payload)}` : ''}`)
}
</script>

<template>
  <section class="card-standalone-case">
    <header class="card-standalone-case__header">
      <h4>1.2 Installed + Toggle/Actions</h4>
      <p>Card 只接收展示字段和 actions；switch.checked 由业务在事件后显式更新。</p>
    </header>

    <div class="card-installed-demo">
      <form class="card-installed-demo__form">
        <strong>toggle action</strong>
        <label class="card-installed-demo__checkbox">
          <input v-model="showToggleAction" type="checkbox" />
          show action
        </label>
        <label class="card-installed-demo__checkbox">
          <input v-model="checked" type="checkbox" />
          checked
        </label>
        <label class="card-installed-demo__checkbox">
          <input v-model="toggleDisabled" type="checkbox" />
          disabled
        </label>

        <strong>button action</strong>
        <label class="card-installed-demo__checkbox">
          <input v-model="showButtonAction" type="checkbox" />
          show action
        </label>
        <label class="card-installed-demo__checkbox">
          <input v-model="buttonDisabled" type="checkbox" />
          disabled
        </label>

        <strong>custom action slot</strong>
        <label class="card-installed-demo__checkbox">
          <input v-model="showCustomAction" type="checkbox" />
          show action
        </label>
        <label class="card-installed-demo__checkbox">
          <input v-model="customDisabled" type="checkbox" />
          disabled
        </label>

        <strong>more action</strong>
        <label>
          primary actions limit
          <select v-model.number="primaryActionsLimit">
            <option :value="0">0</option>
            <option :value="1">1</option>
            <option :value="2">2</option>
            <option :value="3">3</option>
            <option :value="4">4</option>
            <option :value="5">5</option>
          </select>
        </label>
        <label>
          overflow placement
          <select v-model="overflowMenuPlacement">
            <option value="bottom-end">bottom-end</option>
            <option value="top-end">top-end</option>
          </select>
        </label>
        <label class="card-installed-demo__checkbox">
          <input v-model="editDisabled" type="checkbox" />
          edit item disabled
        </label>

        <strong>card</strong>
        <label class="card-installed-demo__checkbox">
          <input v-model="nameClickable" type="checkbox" />
          nameClickable
        </label>
      </form>

      <div class="card-standalone-case__preview">
        <ExtensionManager.Card
          name="已安装的高德地图 MCP"
          description="Installed Extension 的配置和 action 仍然由外部显式组合。"
          icon="https://img.alicdn.com/imgextra/i4/O1CN01iPPabT1EGRN6uatHP_!!6000000000324-0-tps-512-512.jpg"
          :actions="actions"
          :primary-actions-limit="primaryActionsLimit"
          overflow-menu-label="更多扩展操作"
          :overflow-menu-placement="overflowMenuPlacement"
          :name-clickable="nameClickable"
          @name-click="logEvent('打开详情')"
          @action="handleAction"
        >
          <template #primary-action="{ action, trigger }">
            <button
              class="custom-status-action"
              type="button"
              :disabled="action.disabled"
              :aria-label="action.label"
              @click="trigger({ origin: 'custom-status' })"
            >
              {{ getCustomActionLabel(action) }}
            </button>
          </template>
        </ExtensionManager.Card>

        <div class="card-events">
          <strong>Card events</strong>
          <div v-if="events.length" class="event-list">
            <div v-for="event in events" :key="event" class="event-item">{{ event }}</div>
          </div>
          <span v-else>暂无事件。</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.card-standalone-case {
  padding: 16px;
  border: 1px solid #eaecf0;
  border-radius: 8px;
  background: #fcfcfd;
}

.card-standalone-case__header {
  margin-bottom: 14px;
}

.card-standalone-case__header h4 {
  margin: 0 0 6px;
  color: #1f2937;
  font-size: 15px;
}

.card-standalone-case__header p {
  margin: 0;
  color: #667085;
  font-size: 13px;
}

.card-installed-demo {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 18px;
}

.card-installed-demo__form {
  display: grid;
  gap: 10px;
  align-content: start;
}

.card-installed-demo__form strong {
  margin-top: 4px;
  color: #1f2937;
  font-size: 13px;
}

.card-installed-demo__form label {
  display: grid;
  gap: 6px;
  color: #344054;
  font-size: 13px;
}

.card-installed-demo__form select {
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d0d5dd;
  border-radius: 6px;
}

.card-installed-demo__checkbox {
  display: flex !important;
  align-items: center;
  gap: 8px !important;
}

.card-standalone-case__preview {
  display: grid;
  align-content: start;
  gap: 14px;
  min-width: 0;
  padding: 14px;
  border: 1px solid #eaecf0;
  border-radius: 8px;
  background: #fff;
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

.card-events {
  display: grid;
  gap: 8px;
  color: #667085;
  font-size: 13px;
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.event-item {
  padding: 6px 8px;
  border-radius: 6px;
  background: #f8fafc;
  color: #344054;
}

@media (max-width: 760px) {
  .card-installed-demo {
    grid-template-columns: 1fr;
  }
}
</style>
