<script setup lang="ts">
import { IconMore } from '@opentiny/tiny-robot-svgs'
import type { CSSProperties } from 'vue'
import { computed } from 'vue'
import type {
  ExtensionCardAddAction,
  ExtensionCardEmits,
  ExtensionCardMoreAction,
  ExtensionCardProps,
  ExtensionCardSlots,
} from '../index.type'
import ExtensionCardPopover from './ExtensionCardPopover.vue'
import ExtensionCardPrimaryActions from './ExtensionCardPrimaryActions.vue'

const props = withDefaults(defineProps<ExtensionCardProps>(), {
  nameClickable: true,
  primaryActions: () => [],
  moreActions: () => [],
  moreActionDisabled: false,
  moreActionAriaLabel: '更多操作',
  moreActionPlacement: 'bottom-end',
})

defineSlots<ExtensionCardSlots>()

const emit = defineEmits<ExtensionCardEmits>()

const loadingAddAction = computed(() => {
  return props.primaryActions.find(
    (action): action is ExtensionCardAddAction => !action.hidden && action.type === 'add' && action.state === 'loading',
  )
})

const hasVisiblePrimaryActions = computed(() => props.primaryActions.some((action) => !action.hidden))

const shouldShowActions = computed(() => hasVisiblePrimaryActions.value || props.moreActions.length > 0)

const isProgressIndeterminate = computed(() => typeof loadingAddAction.value?.progress !== 'number')

const progressStyle = computed<CSSProperties | undefined>(() => {
  const progress = loadingAddAction.value?.progress

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

const handleMoreAction = (action: ExtensionCardMoreAction, close: () => void) => {
  if (action.disabled) return
  close()
  emit('action', { area: 'more', type: 'more', action })
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
      <div v-if="description" class="tr-extension-card__description" :title="description">
        {{ description }}
      </div>
    </div>

    <div v-if="shouldShowActions" class="tr-extension-card__actions" @click.stop @keydown.stop>
      <ExtensionCardPrimaryActions
        v-if="hasVisiblePrimaryActions"
        :actions="primaryActions"
        @action="emit('action', $event)"
      >
        <template #custom-action="{ action, trigger }">
          <slot name="custom-action" :action="action" :trigger="trigger" />
        </template>
      </ExtensionCardPrimaryActions>

      <div v-if="moreActions.length" class="tr-extension-card__more-action">
        <ExtensionCardPopover as-child :placement="moreActionPlacement">
          <template #trigger="{ popoverId, open }">
            <button
              class="tr-extension-card__icon-button"
              type="button"
              :popovertarget="popoverId"
              popovertargetaction="toggle"
              :title="moreActionAriaLabel"
              :aria-label="moreActionAriaLabel"
              :aria-expanded="open"
              :disabled="moreActionDisabled"
            >
              <IconMore class="tr-extension-card__action-icon" />
            </button>
          </template>
          <template #content="{ close }">
            <ul class="tr-extension-card__more-menu">
              <li v-for="action in moreActions" :key="action.id">
                <button
                  class="tr-extension-card__more-menu-item"
                  :class="{ 'is-danger': action.danger }"
                  type="button"
                  :disabled="action.disabled"
                  @click="handleMoreAction(action, close)"
                >
                  <component v-if="action.icon" :is="action.icon" class="tr-extension-card__more-menu-item-icon" />
                  <span>{{ action.label }}</span>
                </button>
              </li>
            </ul>
          </template>
        </ExtensionCardPopover>
      </div>
    </div>

    <div v-if="loadingAddAction" class="tr-extension-card__progress">
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
  cursor: default;
}

.tr-extension-card__name.is-clickable:hover {
  text-decoration: underline;
}

.tr-extension-card__name.is-clickable:focus-visible {
  border-radius: 4px;
  box-shadow: 0 0 0 2px var(--tr-extension-card-focus-color);
}

.tr-extension-card__description {
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
