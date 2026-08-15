<script setup lang="ts">
import type { ExtensionCardAction, ExtensionCardActionEvent, ExtensionCardProps } from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'
import { IconDelete, IconEditPen, IconSparkles } from '@opentiny/tiny-robot-svgs'
import { computed, markRaw, ref } from 'vue'

type IconMode = 'placeholder' | 'string' | 'component'
type ProgressMode = 'hidden' | 'determinate' | 'indeterminate'

const iconMode = ref<IconMode>('component')
const progressMode = ref<ProgressMode>('determinate')
const progress = ref(45)
const primaryActionsLimit = ref(1)
const overflowMenuShowIcons = ref(true)
const switchChecked = ref(true)
const lastEvent = ref<ExtensionCardActionEvent>()

const sparklesIcon = markRaw(IconSparkles)
const editIcon = markRaw(IconEditPen)
const deleteIcon = markRaw(IconDelete)

const cardIcon = computed<ExtensionCardProps['icon']>(() => {
  if (iconMode.value === 'string') return 'https://example.com/playground-icon.png'
  if (iconMode.value === 'component') return sparklesIcon
  return undefined
})

const cardProgress = computed<ExtensionCardProps['progress']>(() => {
  if (progressMode.value === 'hidden') return undefined
  if (progressMode.value === 'indeterminate') return 'indeterminate'
  return progress.value
})

const actions = computed<ExtensionCardAction[]>(() => [
  {
    id: 'enabled',
    type: 'switch',
    label: switchChecked.value ? '禁用扩展' : '启用扩展',
    checked: switchChecked.value,
    icon: sparklesIcon,
  },
  { id: 'configure', type: 'button', label: '配置', icon: editIcon },
  { id: 'inspect', type: 'custom', label: '检查', data: { origin: 'playground' } },
  { id: 'delete', type: 'button', label: '删除', icon: deleteIcon, danger: true },
])

const handleAction = (event: ExtensionCardActionEvent) => {
  lastEvent.value = event
  if (event.type === 'switch' && typeof event.checked === 'boolean') switchChecked.value = event.checked
}

const handleNameClick = () => {
  lastEvent.value = { id: 'name', type: 'custom', payload: { origin: 'name-click' } }
}
</script>

<template>
  <div class="storybook-card-playground">
    <div class="storybook-card-playground__controls">
      <label>
        名称
        <input value="Playground extension" aria-label="名称" readonly />
      </label>
      <label>
        图标
        <select v-model="iconMode" aria-label="图标">
          <option value="placeholder">占位符</option>
          <option value="string">图片 URL</option>
          <option value="component">Vue component</option>
        </select>
      </label>
      <label>
        主操作数量
        <input v-model.number="primaryActionsLimit" type="number" min="0" max="4" step="1" aria-label="主操作数量" />
      </label>
      <label>
        进度模式
        <select v-model="progressMode" aria-label="进度模式">
          <option value="hidden">隐藏</option>
          <option value="determinate">确定进度</option>
          <option value="indeterminate">不确定进度</option>
        </select>
      </label>
      <label>
        数值
        <input
          v-model.number="progress"
          type="number"
          min="0"
          max="100"
          :disabled="progressMode !== 'determinate'"
          aria-label="进度数值"
        />
      </label>
      <label class="storybook-card-playground__checkbox">
        <input v-model="overflowMenuShowIcons" type="checkbox" />
        显示溢出图标
      </label>
    </div>

    <ExtensionManager.Card
      name="Playground extension"
      description="Use the controls to exercise the standalone Card contract."
      :icon="cardIcon"
      :actions="actions"
      :primary-actions-limit="primaryActionsLimit"
      :progress="cardProgress"
      overflow-menu-label="扩展操作"
      :overflow-menu-show-icons="overflowMenuShowIcons"
      @action="handleAction"
      @name-click="handleNameClick"
    >
      <template #primary-action="{ action, trigger }">
        <button type="button" :disabled="action.disabled" @click="trigger({ origin: 'playground' })">
          {{ action.label }}
        </button>
      </template>
    </ExtensionManager.Card>

    <output class="storybook-event-output">{{ JSON.stringify(lastEvent) }}</output>
  </div>
</template>

<style scoped>
.storybook-card-playground {
  display: grid;
  gap: 16px;
  width: min(820px, 92vw);
}

.storybook-card-playground__controls {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  padding: 14px;
  border: 1px solid #d9e7fb;
  border-radius: 10px;
  background: #fff;
  color: #52607a;
  font-size: 12px;
}

.storybook-card-playground__controls label {
  display: grid;
  gap: 5px;
}

.storybook-card-playground__controls input:not([type='checkbox']),
.storybook-card-playground__controls select {
  box-sizing: border-box;
  width: 100%;
  min-height: 30px;
  padding: 0 8px;
  border: 1px solid #cbd8ed;
  border-radius: 6px;
  background: #fff;
  color: #243f75;
  font: inherit;
}

.storybook-card-playground__checkbox {
  display: flex !important;
  align-items: center;
  grid-column: span 3;
  gap: 6px !important;
}

.storybook-card-playground__checkbox input {
  margin: 0;
}

.storybook-event-output {
  padding: 8px 10px;
  border-radius: 6px;
  background: #f1f5ff;
  color: #52607a;
  font:
    12px/1.5 ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
  overflow-wrap: anywhere;
}

@media (max-width: 720px) {
  .storybook-card-playground__controls {
    grid-template-columns: 1fr;
  }

  .storybook-card-playground__checkbox {
    grid-column: auto;
  }
}
</style>
