<script setup lang="ts">
import { ref } from 'vue'
import { IconEditPen } from '@opentiny/tiny-robot-svgs'
import type { ExtensionCardAction, ExtensionCardActionEvent } from '../../../components/src/extension-manager/index.type'
import ExtensionCard from '../../../components/src/extension-manager/components/ExtensionCard.vue'

const actions: ExtensionCardAction[] = [
  { id: 'enabled', type: 'switch', label: '启用扩展', checked: true },
  { id: 'install', type: 'button', label: '安装' },
  { id: 'inspect', type: 'custom', label: '检查', data: { origin: 'fixture' } },
  { id: 'hidden', type: 'button', label: '隐藏操作', hidden: true },
  { id: 'disabled', type: 'button', label: '禁用操作', disabled: true },
]

const lastEvent = ref<ExtensionCardActionEvent>()

const handleAction = (event: ExtensionCardActionEvent) => {
  lastEvent.value = event
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
      :primary-actions-limit="1"
      overflow-menu-label="扩展操作"
      @action="handleAction"
    />

    <ExtensionCard
      data-testid="custom-fallback-card"
      name="Custom fallback"
      :actions="[{ id: 'fallback', type: 'custom', label: '自定义操作' }]"
      @action="handleAction"
    />

    <ExtensionCard data-testid="progress-card" name="Progress card" progress="indeterminate" />
    <ExtensionCard data-testid="high-progress-card" name="High progress" :progress="125" />
    <ExtensionCard data-testid="low-progress-card" name="Low progress" :progress="-10" />

    <output data-testid="event-id">{{ lastEvent?.id }}</output>
    <output data-testid="event-type">{{ lastEvent?.type }}</output>
    <output data-testid="event-checked">{{ lastEvent?.checked }}</output>
  </div>
</template>
