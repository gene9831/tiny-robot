<script setup lang="ts">
import { IconDelete } from '@opentiny/tiny-robot-svgs'
import type { CSSProperties } from 'vue'
import { computed } from 'vue'
import type { ExtensionCardEmits, ExtensionCardProps, ExtensionCardSlots } from '../index.type'

const props = withDefaults(defineProps<ExtensionCardProps>(), {
  nameClickable: true,
})

defineSlots<ExtensionCardSlots>()

const emit = defineEmits<ExtensionCardEmits>()

const toggleAction = computed(() => {
  return props.primaryAction?.type === 'toggle' ? props.primaryAction : undefined
})

const addAction = computed(() => {
  return props.primaryAction?.type === 'add' ? props.primaryAction : undefined
})

const addState = computed(() => addAction.value?.state ?? 'idle')

const addText = computed(() => {
  if (addState.value === 'loading') return '添加中'
  if (addState.value === 'added') return '已添加'
  if (addState.value === 'failed') return '重试'
  return '添加'
})

const descriptionStyle = computed<CSSProperties | undefined>(() => {
  if (typeof props.descriptionLines !== 'number') {
    return undefined
  }

  return {
    '--tr-extension-card-description-lines': Math.max(1, Math.floor(props.descriptionLines)),
  }
})

const isAddDisabled = computed(() => {
  if (!addAction.value) return true
  return addAction.value.disabled || addState.value === 'loading' || addState.value === 'added'
})

const shouldShowActions = computed(() => Boolean(props.primaryAction || props.deleteAction))

const isProgressIndeterminate = computed(() => typeof addAction.value?.progress !== 'number')

const progressStyle = computed<CSSProperties | undefined>(() => {
  const progress = addAction.value?.progress

  if (typeof progress !== 'number') {
    return undefined
  }

  return {
    width: `${Math.min(100, Math.max(0, progress))}%`,
  }
})

const handleNameClick = (event: MouseEvent) => {
  if (!props.nameClickable) return
  emit('name-click', event)
}

const handleNameKeydown = (event: KeyboardEvent) => {
  if (!props.nameClickable || (event.key !== 'Enter' && event.key !== ' ')) return
  event.preventDefault()
  emit('name-click', event)
}

const handleAdd = () => {
  if (isAddDisabled.value) return
  emit('add')
}

const handleToggle = (event: Event) => {
  if (!toggleAction.value || toggleAction.value.disabled) return
  emit('toggle', (event.target as HTMLInputElement).checked)
}

const handleDelete = () => {
  if (!props.deleteAction || props.deleteAction.disabled) return
  emit('delete')
}
</script>

<template>
  <div class="tr-extension-card">
    <div class="tr-extension-card__icon-region">
      <slot name="icon">
        <img v-if="icon" :src="icon" :alt="iconAlt || name" class="tr-extension-card__icon" />
        <div v-else class="tr-extension-card__icon tr-extension-card__icon--placeholder">
          {{ name.slice(0, 1) }}
        </div>
      </slot>
    </div>

    <div class="tr-extension-card__content">
      <div
        class="tr-extension-card__name"
        :class="{ 'is-clickable': nameClickable }"
        :role="nameClickable ? 'button' : undefined"
        :tabindex="nameClickable ? 0 : undefined"
        :title="name"
        @click="handleNameClick"
        @keydown="handleNameKeydown"
      >
        {{ name }}
      </div>
      <div v-if="description" class="tr-extension-card__description" :style="descriptionStyle" :title="description">
        {{ description }}
      </div>
      <div v-if="$slots.meta" class="tr-extension-card__meta">
        <slot name="meta" />
      </div>
    </div>

    <div v-if="shouldShowActions" class="tr-extension-card__actions" @click.stop @keydown.stop>
      <div v-if="deleteAction" class="tr-extension-card__secondary-actions">
        <button
          class="tr-extension-card__icon-button"
          type="button"
          title="删除"
          :disabled="deleteAction.disabled"
          @click="handleDelete"
        >
          <IconDelete class="tr-extension-card__action-icon" />
        </button>
      </div>

      <div v-if="primaryAction" class="tr-extension-card__primary-action">
        <label v-if="toggleAction" class="tr-extension-card__switch" :class="{ 'is-disabled': toggleAction.disabled }">
          <input
            type="checkbox"
            :checked="toggleAction.enabled"
            :disabled="toggleAction.disabled"
            @change="handleToggle"
          />
          <span class="tr-extension-card__switch-track"></span>
        </label>

        <button
          v-else-if="addAction"
          class="tr-extension-card__add"
          :class="{
            'is-loading': addState === 'loading',
            'is-added': addState === 'added',
            'is-failed': addState === 'failed',
          }"
          type="button"
          :disabled="isAddDisabled"
          @click="handleAdd"
        >
          {{ addText }}
        </button>
      </div>
    </div>

    <div v-if="addAction && addState === 'loading'" class="tr-extension-card__progress">
      <span
        class="tr-extension-card__progress-bar"
        :class="{ 'is-indeterminate': isProgressIndeterminate }"
        :style="progressStyle"
      ></span>
    </div>
  </div>
</template>

<style lang="less" scoped>
.tr-extension-card {
  --tr-extension-card-bg-color: #f8f8f8;
  --tr-extension-card-bg-color-hover: rgba(0, 0, 0, 0.04);
  --tr-extension-card-focus-color: #191919;
  --tr-extension-card-icon-color: #808080;
  --tr-extension-card-add-button-border-color: var(--tr-border-color-default);
  --tr-extension-card-add-button-text-color: var(--tr-text-primary);
  --tr-extension-card-progress-bg-color: var(--tr-extension-card-bg-color-hover);
  --tr-extension-card-progress-bar-color: var(--tr-success-color, #52c41a);
  --tr-extension-card-switch-bg-color: var(--tr-extension-card-bg-color-hover);
  --tr-extension-card-switch-bg-color-checked: var(--tr-extension-card-focus-color);

  box-sizing: border-box;
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  min-height: 86px;
  padding: 14px 20px;
  border-radius: 8px;
  background: var(--tr-extension-card-bg-color);
  overflow: hidden;
}

.tr-extension-card__icon-region {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
}

.tr-extension-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
  overflow: hidden;
}

.tr-extension-card__icon--placeholder {
  background: var(--tr-extension-card-bg-color-hover);
  color: var(--tr-text-secondary);
  font-size: 18px;
  font-weight: 600;
  cursor: default;
}

.tr-extension-card__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.tr-extension-card__name {
  align-self: flex-start;
  max-width: 100%;
  overflow: hidden;
  color: var(--tr-text-primary);
  font-size: 14px;
  font-weight: 600;
  line-height: 22px;
  outline: none;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tr-extension-card__name.is-clickable {
  cursor: pointer;
}

.tr-extension-card__name.is-clickable:hover {
  text-decoration: underline;
}

.tr-extension-card__name.is-clickable:focus-visible {
  border-radius: 4px;
  box-shadow: 0 0 0 2px var(--tr-extension-card-focus-color);
}

.tr-extension-card__description {
  --description-lines: var(--tr-extension-card-description-lines, 1);

  color: var(--tr-text-secondary);
  font-size: 12px;
  line-height: 18px;
  display: -webkit-box;
  min-block-size: calc(var(--description-lines) * 1lh);
  overflow: hidden;
  -webkit-box-orient: vertical;
  line-clamp: var(--description-lines);
  -webkit-line-clamp: var(--description-lines);
}

.tr-extension-card__meta {
  overflow: hidden;
  color: var(--tr-text-secondary);
  font-size: 12px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tr-extension-card__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.tr-extension-card__primary-action,
.tr-extension-card__secondary-actions {
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
}

.tr-extension-card__switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 40px;
  height: 22px;
  cursor: pointer;
}

.tr-extension-card__switch.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.tr-extension-card__switch input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.tr-extension-card__switch input:checked + .tr-extension-card__switch-track {
  background: var(--tr-extension-card-switch-bg-color-checked);
}

.tr-extension-card__switch input:checked + .tr-extension-card__switch-track::after {
  transform: translateX(18px);
}

.tr-extension-card__switch-track {
  position: relative;
  display: block;
  width: 40px;
  height: 22px;
  border-radius: 999px;
  background: var(--tr-extension-card-switch-bg-color);
  transition: background 0.2s ease;
}

.tr-extension-card__switch-track::after {
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

.tr-extension-card__add {
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

.tr-extension-card__add:disabled {
  cursor: not-allowed;
  opacity: 0.75;
}

.tr-extension-card__add.is-loading {
  color: var(--tr-extension-card-add-button-text-color);
}

.tr-extension-card__add.is-added {
  color: var(--tr-text-secondary);
}

.tr-extension-card__add.is-failed {
  color: var(--tr-error-color, #f23030);
}

.tr-extension-card__progress {
  position: absolute;
  right: 20px;
  bottom: 8px;
  left: 74px;
  height: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--tr-extension-card-progress-bg-color);
}

.tr-extension-card__progress-bar {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--tr-extension-card-progress-bar-color);
}

.tr-extension-card__progress-bar.is-indeterminate {
  width: 40%;
  animation: tr-extension-card-progress-indeterminate 1.2s ease-in-out infinite;
}

@keyframes tr-extension-card-progress-indeterminate {
  0% {
    transform: translateX(-120%);
  }

  100% {
    transform: translateX(260%);
  }
}
</style>
