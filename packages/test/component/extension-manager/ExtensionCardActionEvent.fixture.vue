<script setup lang="ts">
import { computed, ref } from 'vue'
import type {
  ExtensionCardActionEvent,
  ExtensionCardMoreMenuAction,
  ExtensionCardPrimaryAction,
} from '../../../components/src/extension-manager/index.type'
import ExtensionCard from '../../../components/src/extension-manager/components/ExtensionCard.vue'

const primaryActions: ExtensionCardPrimaryAction[] = [
  {
    id: 'toggle-extension',
    type: 'toggle',
    checked: true,
    ariaLabel: '扩展开关',
  },
  {
    id: 'install-extension',
    type: 'add',
    state: 'error',
  },
  {
    id: 'configure-extension',
    type: 'button',
    label: '配置',
  },
  {
    id: 'inspect-extension',
    type: 'custom',
  },
]

const moreMenuActions: ExtensionCardMoreMenuAction[] = [{ id: 'delete-extension', label: '删除' }]

const lastEvent = ref<ExtensionCardActionEvent>()

const eventChecked = computed(() => {
  return typeof lastEvent.value?.checked === 'boolean' ? String(lastEvent.value.checked) : ''
})

const eventPayload = computed(() => JSON.stringify(lastEvent.value?.payload ?? null))
</script>

<template>
  <div>
    <ExtensionCard
      data-testid="action-event-card"
      name="Action event card"
      :primary-actions="primaryActions"
      :more-menu-actions="moreMenuActions"
      more-menu-trigger-aria-label="扩展操作菜单"
      more-menu-placement="top-end"
      @action="lastEvent = $event"
    >
      <template #custom-action="{ trigger }">
        <button type="button" @click="trigger({ source: 'fixture' })">检查</button>
      </template>
    </ExtensionCard>

    <output data-testid="event-id">{{ lastEvent?.id }}</output>
    <output data-testid="event-checked">{{ eventChecked }}</output>
    <output data-testid="event-payload">{{ eventPayload }}</output>
  </div>
</template>
