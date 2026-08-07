<script setup lang="ts">
import { IconMore } from '@opentiny/tiny-robot-svgs'
import type { ExtensionCardMoreMenuAction, ExtensionCardMoreMenuPlacement } from '../index.type'
import ExtensionCardPopover from './ExtensionCardPopover.vue'

const props = withDefaults(
  defineProps<{
    actions?: ExtensionCardMoreMenuAction[]
    triggerAriaLabel?: string
    placement?: ExtensionCardMoreMenuPlacement
  }>(),
  {
    actions: () => [],
    triggerAriaLabel: '更多操作',
    placement: 'bottom-end',
  },
)

const emit = defineEmits<{
  (e: 'action', action: ExtensionCardMoreMenuAction): void
}>()

const handleAction = (action: ExtensionCardMoreMenuAction, close: () => void) => {
  if (action.disabled) return
  close()
  emit('action', action)
}
</script>

<template>
  <div v-if="props.actions.length" class="tr-extension-card__more-action">
    <ExtensionCardPopover as-child :placement="props.placement">
      <template #trigger="{ popoverId, open }">
        <button
          class="tr-extension-card__icon-button"
          type="button"
          :popovertarget="popoverId"
          popovertargetaction="toggle"
          :title="props.triggerAriaLabel"
          :aria-label="props.triggerAriaLabel"
          :aria-expanded="open"
        >
          <IconMore class="tr-extension-card__action-icon" />
        </button>
      </template>
      <template #content="{ close }">
        <ul class="tr-extension-card__more-menu">
          <li v-for="action in props.actions" :key="action.id">
            <button
              class="tr-extension-card__more-menu-item"
              :class="{ 'is-danger': action.danger }"
              type="button"
              :disabled="action.disabled"
              @click="handleAction(action, close)"
            >
              <component v-if="action.icon" :is="action.icon" class="tr-extension-card__more-menu-item-icon" />
              <span>{{ action.label }}</span>
            </button>
          </li>
        </ul>
      </template>
    </ExtensionCardPopover>
  </div>
</template>

<style lang="less" scoped>
.tr-extension-card__more-action {
  display: inline-flex;
  align-items: center;
}

.tr-extension-card__icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
}

.tr-extension-card__icon-button:hover:not(:disabled) {
  background: var(--tr-extension-card-bg-color-hover);
}

.tr-extension-card__icon-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.tr-extension-card__action-icon {
  width: 16px;
  height: 16px;
  color: var(--tr-extension-card-icon-color);
  transform: rotate(90deg);
}

.tr-extension-card__more-menu {
  padding: 0;
  margin: 0;
  list-style: none;
}

.tr-extension-card__more-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 4px 8px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--tr-dropdown-menu-item-color);
  cursor: pointer;
  font-size: 14px;
  line-height: 24px;
  text-align: left;
  white-space: nowrap;
  transition: background-color 0.3s ease;
}

.tr-extension-card__more-menu-item:hover:not(:disabled) {
  background-color: var(--tr-dropdown-menu-item-hover-bg-color);
}

.tr-extension-card__more-menu-item.is-danger {
  color: var(--tr-error-color, #f23030);
}

.tr-extension-card__more-menu-item:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.tr-extension-card__more-menu-item-icon {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
}
</style>
