<script setup lang="ts">
import type { VNode } from 'vue'
import { computed } from 'vue'
import type {
  ExtensionCardActionEvent,
  ExtensionCardAddAction,
  ExtensionCardButtonAction,
  ExtensionCardCustomAction,
  ExtensionCardPrimaryAction,
  ExtensionCardToggleAction,
} from '../index.type'

const props = withDefaults(
  defineProps<{
    actions?: ExtensionCardPrimaryAction[]
  }>(),
  {
    actions: () => [],
  },
)

defineSlots<{
  'custom-action'?: (props: { action: ExtensionCardCustomAction; trigger: (payload?: unknown) => void }) => VNode[]
}>()

const emit = defineEmits<{
  (e: 'action', payload: ExtensionCardActionEvent): void
}>()

const visibleActions = computed(() => props.actions.filter((action) => !action.hidden))

const getAddState = (action: ExtensionCardAddAction) => action.state ?? 'idle'

const getAddText = (action: ExtensionCardAddAction) => {
  const state = getAddState(action)
  if (state === 'pending') return '添加中'
  if (state === 'success') return '已添加'
  if (state === 'error') return '重试'
  return action.label ?? '添加'
}

const isAddDisabled = (action: ExtensionCardAddAction) => {
  const state = getAddState(action)
  return action.disabled || state === 'pending' || state === 'success'
}

const handleAdd = (action: ExtensionCardAddAction) => {
  if (isAddDisabled(action)) return
  emit('action', { id: action.id })
}

const handleToggle = (action: ExtensionCardToggleAction, event: Event) => {
  if (action.disabled) return
  emit('action', {
    id: action.id,
    checked: (event.target as HTMLInputElement).checked,
  })
}

const handleButton = (action: ExtensionCardButtonAction) => {
  if (action.disabled) return
  emit('action', { id: action.id })
}

const handleCustom = (action: ExtensionCardCustomAction, payload?: unknown) => {
  if (action.disabled) return
  emit('action', { id: action.id, payload })
}
</script>

<template>
  <div class="tr-extension-card-primary-actions">
    <template v-for="action in visibleActions" :key="action.id">
      <label
        v-if="action.type === 'toggle'"
        class="tr-extension-card-primary-actions__switch"
        :class="{ 'is-disabled': action.disabled }"
        :aria-label="action.ariaLabel"
      >
        <input
          type="checkbox"
          :checked="action.checked"
          :disabled="action.disabled"
          @change="handleToggle(action, $event)"
        />
        <span class="tr-extension-card-primary-actions__switch-track"></span>
      </label>

      <button
        v-else-if="action.type === 'add'"
        class="tr-extension-card-primary-actions__add"
        :class="{
          'is-loading': getAddState(action) === 'pending',
          'is-added': getAddState(action) === 'success',
          'is-failed': getAddState(action) === 'error',
        }"
        type="button"
        :aria-label="action.ariaLabel"
        :disabled="isAddDisabled(action)"
        @click="handleAdd(action)"
      >
        {{ getAddText(action) }}
      </button>

      <button
        v-else-if="action.type === 'button'"
        class="tr-extension-card-primary-actions__button"
        type="button"
        :aria-label="action.ariaLabel"
        :disabled="action.disabled"
        @click="handleButton(action)"
      >
        <component v-if="action.icon" :is="action.icon" class="tr-extension-card-primary-actions__button-icon" />
        <span>{{ action.label }}</span>
      </button>

      <span v-else class="tr-extension-card-primary-actions__custom-action" :class="{ 'is-disabled': action.disabled }">
        <slot name="custom-action" :action="action" :trigger="(payload: unknown) => handleCustom(action, payload)" />
      </span>
    </template>
  </div>
</template>

<style lang="less" scoped>
.tr-extension-card-primary-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.tr-extension-card-primary-actions__switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 40px;
  height: 22px;
  cursor: pointer;
}

.tr-extension-card-primary-actions__switch.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.tr-extension-card-primary-actions__switch input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.tr-extension-card-primary-actions__switch input:checked + .tr-extension-card-primary-actions__switch-track {
  background: var(--tr-extension-card-switch-bg-color-checked);
}

.tr-extension-card-primary-actions__switch input:checked + .tr-extension-card-primary-actions__switch-track::after {
  transform: translateX(18px);
}

.tr-extension-card-primary-actions__switch-track {
  position: relative;
  display: block;
  width: 40px;
  height: 22px;
  border-radius: 999px;
  background: var(--tr-extension-card-switch-bg-color);
  transition: background 0.2s ease;
}

.tr-extension-card-primary-actions__switch-track::after {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgb(0 0 0 / 16%);
  content: '';
  transition: transform 0.2s ease;
}

.tr-extension-card-primary-actions__add {
  min-width: 64px;
  height: 30px;
  padding: 0 16px;
  border: 1px solid var(--tr-extension-card-add-button-border-color);
  border-radius: 999px;
  background: transparent;
  color: var(--tr-text-primary);
  cursor: pointer;
  font-size: 13px;
}

.tr-extension-card-primary-actions__add:disabled {
  cursor: not-allowed;
  opacity: 0.75;
}

.tr-extension-card-primary-actions__add.is-loading {
  color: var(--tr-extension-card-add-button-text-color);
}

.tr-extension-card-primary-actions__add.is-added {
  color: var(--tr-text-secondary);
}

.tr-extension-card-primary-actions__add.is-failed {
  color: var(--tr-error-color, #f23030);
}

.tr-extension-card-primary-actions__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 64px;
  height: 30px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: var(--tr-extension-card-bg-color-hover);
  color: var(--tr-text-primary);
  cursor: pointer;
  font-size: 13px;
}

.tr-extension-card-primary-actions__button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.tr-extension-card-primary-actions__button-icon {
  width: 16px;
  height: 16px;
}

.tr-extension-card-primary-actions__custom-action {
  display: inline-flex;
  align-items: center;
}

.tr-extension-card-primary-actions__custom-action.is-disabled {
  pointer-events: none;
  opacity: 0.5;
}
</style>
