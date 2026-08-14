<script setup lang="ts">
import { computed, ref } from 'vue'
import { IconEditPen } from '@opentiny/tiny-robot-svgs'
import type {
  ExtensionCardAction,
  ExtensionCardActionEvent,
} from '../../../components/src/extension-manager/index.type'
import ExtensionCard from '../../../components/src/extension-manager/components/ExtensionCard.vue'

const actions: ExtensionCardAction[] = [
  { id: 'enabled', type: 'switch', label: '启用扩展', checked: true },
  { id: 'hidden', type: 'button', label: '隐藏操作', hidden: true },
  { id: 'disabled', type: 'button', label: '禁用操作', disabled: true },
  { id: 'install', type: 'button', label: '安装' },
  { id: 'inspect', type: 'custom', label: '检查', data: { origin: 'fixture' } },
]

const buttonFeedbackActions: ExtensionCardAction[] = [
  { id: 'feedback', type: 'button', label: '反馈按钮' },
  { id: 'disabled-feedback', type: 'button', label: '禁用反馈按钮', disabled: true },
]

const mixedIconMenuActions: ExtensionCardAction[] = [
  { id: 'menu-with-icon', type: 'button', label: '带图标菜单项', icon: IconEditPen },
  { id: 'menu-without-icon', type: 'button', label: '无图标菜单项' },
]

const noIconMenuActions: ExtensionCardAction[] = [
  { id: 'plain-menu-first', type: 'button', label: '普通菜单项一' },
  { id: 'plain-menu-second', type: 'custom', label: '普通菜单项二' },
]

const customIconSizeActions: ExtensionCardAction[] = [
  { id: 'custom-primary-icon', type: 'button', label: '自定义主操作图标', icon: IconEditPen },
  { id: 'custom-menu-icon', type: 'button', label: '自定义菜单图标', icon: IconEditPen },
  { id: 'custom-menu-plain', type: 'button', label: '自定义菜单无图标' },
]

const createDuplicateActions = (id: string): ExtensionCardAction[] => [
  { id, type: 'button', label: `${id} first` },
  { id, type: 'button', label: `${id} second` },
]

const duplicateActions = ref(createDuplicateActions('duplicate-initial'))

const replaceDuplicateActions = () => {
  duplicateActions.value = createDuplicateActions('duplicate-initial')
}

const changeDuplicateActions = () => {
  duplicateActions.value = createDuplicateActions('duplicate-changed')
}

const overflowActions = ref<ExtensionCardAction[]>([
  { id: 'overflow-enabled', type: 'switch', label: '启用扩展', checked: true },
  { id: 'overflow-hidden', type: 'button', label: '隐藏溢出操作', hidden: true },
  { id: 'overflow-custom', type: 'custom', label: '自定义溢出操作' },
  { id: 'overflow-danger', type: 'button', label: '危险操作', danger: true },
])

const lastEvent = ref<ExtensionCardActionEvent>()

const eventChecked = computed(() => {
  return typeof lastEvent.value?.checked === 'boolean' ? String(lastEvent.value.checked) : ''
})

const handleAction = (event: ExtensionCardActionEvent) => {
  lastEvent.value = event

  if (event.type !== 'switch' || typeof event.checked !== 'boolean') return

  overflowActions.value = overflowActions.value.map((action) =>
    action.id === event.id && action.type === 'switch' ? { ...action, checked: event.checked } : action,
  )
}
</script>

<template>
  <div>
    <ExtensionCard
      data-testid="presentation-card"
      name="Item name"
      description="Item description"
      icon="https://example.com/item-icon.png"
    />

    <ExtensionCard data-testid="component-icon-card" name="Component icon" :icon="IconEditPen" />

    <ExtensionCard
      data-testid="actions-card"
      name="Actions card"
      :actions="actions"
      :primary-actions-limit="2"
      overflow-menu-label="扩展操作"
      @action="handleAction"
    />

    <ExtensionCard
      data-testid="button-feedback-card"
      name="Button feedback"
      :actions="buttonFeedbackActions"
      :primary-actions-limit="2"
    />

    <ExtensionCard
      data-testid="mixed-icon-menu-card"
      name="Mixed menu icons"
      :actions="mixedIconMenuActions"
      :primary-actions-limit="0"
    />

    <ExtensionCard
      data-testid="no-icon-menu-card"
      name="No menu icons"
      :actions="noIconMenuActions"
      :primary-actions-limit="0"
    />

    <ExtensionCard
      data-testid="custom-icon-size-card"
      name="Custom icon size"
      :style="{
        '--tr-extension-card-action-icon-size': '20px',
        '--tr-extension-card-menu-icon-slot-size': '24px',
      }"
      :actions="customIconSizeActions"
      :primary-actions-limit="1"
    />

    <button data-testid="replace-duplicate-actions" type="button" @click="replaceDuplicateActions">
      Replace duplicate actions
    </button>
    <button data-testid="change-duplicate-actions" type="button" @click="changeDuplicateActions">
      Change duplicate action IDs
    </button>
    <ExtensionCard data-testid="duplicate-actions-card" name="Duplicate actions" :actions="duplicateActions" />

    <ExtensionCard
      data-testid="custom-fallback-card"
      name="Custom fallback"
      :actions="[{ id: 'fallback', type: 'custom', label: '自定义操作' }]"
      @action="handleAction"
    />

    <ExtensionCard
      data-testid="overflow-switch-card"
      name="Overflow switch"
      :actions="overflowActions"
      :primary-actions-limit="0"
      overflow-menu-label="扩展操作"
      @action="handleAction"
    />

    <ExtensionCard data-testid="progress-card" name="Progress card" progress="indeterminate" />
    <ExtensionCard data-testid="high-progress-card" name="High progress" :progress="125" />
    <ExtensionCard data-testid="low-progress-card" name="Low progress" :progress="-10" />

    <output data-testid="event-id">{{ lastEvent?.id }}</output>
    <output data-testid="event-type">{{ lastEvent?.type }}</output>
    <output data-testid="event-checked">{{ eventChecked }}</output>
  </div>
</template>
