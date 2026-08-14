<script setup lang="ts">
import { computed } from 'vue'
import { IconMore } from '@opentiny/tiny-robot-svgs'
import type { ExtensionCardAction, ExtensionCardActionEvent, ExtensionCardOverflowMenuPlacement } from '../index.type'
import ExtensionCardPopover from './ExtensionCardPopover.vue'

const props = withDefaults(
  defineProps<{
    actions?: ExtensionCardAction[]
    label?: string
    placement?: ExtensionCardOverflowMenuPlacement
  }>(),
  {
    actions: () => [],
    label: '更多操作',
    placement: 'bottom-end',
  },
)

const emit = defineEmits<{
  (e: 'action', action: ExtensionCardActionEvent): void
}>()

const visibleActions = computed(() => props.actions.filter((action) => !action.hidden))
const hasLeadingIcons = computed(() =>
  visibleActions.value.some((action) => action.type === 'switch' || Boolean(action.icon)),
)

const handleAction = (action: ExtensionCardAction, close: () => void) => {
  if (action.disabled) return

  close()

  emit('action', {
    id: action.id,
    type: action.type,
    ...(action.type === 'switch' ? { checked: !action.checked } : {}),
  })
}
</script>

<template>
  <div v-if="visibleActions.length" class="tr-extension-card__more-action">
    <ExtensionCardPopover as-child :placement="props.placement">
      <template #trigger="{ popoverId, open }">
        <button
          class="tr-extension-card__icon-button"
          type="button"
          :popovertarget="popoverId"
          popovertargetaction="toggle"
          :title="props.label"
          :aria-label="props.label"
          :aria-expanded="open"
        >
          <IconMore class="tr-extension-card__action-icon" />
        </button>
      </template>
      <template #content="{ close }">
        <ul class="tr-extension-card__more-menu">
          <li v-for="action in visibleActions" :key="action.id">
            <button
              class="tr-extension-card__more-menu-item"
              :class="{ 'is-danger': action.danger }"
              type="button"
              :disabled="action.disabled"
              :aria-pressed="action.type === 'switch' ? action.checked : undefined"
              @click="handleAction(action, close)"
            >
              <span v-if="hasLeadingIcons" class="tr-extension-card__more-menu-item-icon-slot">
                <span
                  v-if="action.type === 'switch'"
                  class="tr-extension-card__more-menu-item-check"
                  aria-hidden="true"
                >
                  {{ action.checked ? '✓' : '' }}
                </span>
                <component v-else-if="action.icon" :is="action.icon" class="tr-extension-card__more-menu-item-icon" />
                <span v-else class="tr-extension-card__more-menu-item-icon-placeholder" aria-hidden="true"></span>
              </span>
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
  width: var(--tr-extension-card-action-icon-size, 16px);
  height: var(--tr-extension-card-action-icon-size, 16px);
}

.tr-extension-card__more-menu-item-icon-slot {
  display: inline-flex;
  flex: 0 0 var(--tr-extension-card-menu-icon-slot-size, 16px);
  align-items: center;
  justify-content: center;
  width: var(--tr-extension-card-menu-icon-slot-size, 16px);
  height: var(--tr-extension-card-menu-icon-slot-size, 16px);
}

.tr-extension-card__more-menu-item-icon-placeholder {
  display: block;
  width: 100%;
  height: 100%;
}

.tr-extension-card__more-menu-item-check {
  display: inline-flex;
  flex: 0 0 var(--tr-extension-card-action-icon-size, 16px);
  align-items: center;
  justify-content: center;
  width: var(--tr-extension-card-action-icon-size, 16px);
  height: var(--tr-extension-card-action-icon-size, 16px);
  color: currentColor;
  font-size: 16px;
  font-weight: 600;
  line-height: 16px;
}
</style>
