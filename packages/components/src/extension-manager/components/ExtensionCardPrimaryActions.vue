<script setup lang="ts">
import type { VNode } from 'vue'
import { computed } from 'vue'
import type {
  ExtensionCardActionEvent,
  ExtensionCardButtonAction,
  ExtensionCardCustomAction,
  ExtensionCardToggleAction,
} from '../index.type'
import type { ExtensionCardRenderAction } from '../internal.type'

const props = withDefaults(
  defineProps<{
    actions?: ExtensionCardRenderAction[]
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

type ExtensionCardRuntimeInstallAction = Extract<ExtensionCardRenderAction, { type: 'install' }>

const getInstallState = (action: ExtensionCardRuntimeInstallAction) =>
  ('state' in action ? action.state : undefined) ?? 'idle'

const getInstallText = (action: ExtensionCardRuntimeInstallAction) => {
  const state = getInstallState(action)
  if (state === 'pending') return '安装中'
  if (state === 'success') return '已安装'
  if (state === 'error') return '重试'
  return action.label ?? '安装'
}

const isInstallDisabled = (action: ExtensionCardRuntimeInstallAction) => {
  const state = getInstallState(action)
  return action.disabled || state === 'pending' || state === 'success'
}

const handleInstall = (action: ExtensionCardRuntimeInstallAction) => {
  if (isInstallDisabled(action)) return
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
        v-else-if="action.type === 'install'"
        class="tr-extension-card-primary-actions__install"
        :class="{
          'is-loading': getInstallState(action) === 'pending',
          'is-installed': getInstallState(action) === 'success',
          'is-failed': getInstallState(action) === 'error',
        }"
        type="button"
        :aria-label="action.ariaLabel"
        :disabled="isInstallDisabled(action)"
        @click="handleInstall(action)"
      >
        {{ getInstallText(action) }}
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

.tr-extension-card-primary-actions__install {
  min-width: 64px;
  height: 30px;
  padding: 0 16px;
  border: 1px solid var(--tr-extension-card-install-button-border-color);
  border-radius: 999px;
  background: transparent;
  color: var(--tr-text-primary);
  cursor: pointer;
  font-size: 13px;
}

.tr-extension-card-primary-actions__install:disabled {
  cursor: not-allowed;
  opacity: 0.75;
}

.tr-extension-card-primary-actions__install.is-loading {
  color: var(--tr-extension-card-install-button-text-color);
}

.tr-extension-card-primary-actions__install.is-installed {
  color: var(--tr-text-secondary);
}

.tr-extension-card-primary-actions__install.is-failed {
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
