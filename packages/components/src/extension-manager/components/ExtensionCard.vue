<script setup lang="ts">
import { computed } from 'vue'
import { useExtensionListContext } from '../composables'
import type { ExtensionCardEmits, ExtensionCardProps, ExtensionCardSlots } from '../index.type'
import type { ExtensionCardRenderAction } from '../internal.type'
import ExtensionCardMoreMenu from './ExtensionCardMoreMenu.vue'
import ExtensionCardPrimaryActions from './ExtensionCardPrimaryActions.vue'

const props = withDefaults(defineProps<ExtensionCardProps>(), {
  nameClickable: true,
})

defineSlots<ExtensionCardSlots>()

const emit = defineEmits<ExtensionCardEmits>()

const extensionListContext = useExtensionListContext()

// 显式传入的数组（包括空数组）会覆盖 List 提供的默认操作。
const resolvedPrimaryActions = computed<ExtensionCardRenderAction[]>(
  () => props.primaryActions ?? extensionListContext?.getDefaultPrimaryActions(props.item.id) ?? [],
)

// 次级菜单操作使用相同的优先级规则，并通过 Card 的 id 获取 List 提供的默认操作。
const resolvedMoreMenuActions = computed(() => {
  return props.moreMenuActions ?? extensionListContext?.getDefaultMoreActions(props.item.id) ?? []
})

const hasVisiblePrimaryActions = computed(() => resolvedPrimaryActions.value.some((action) => !action.hidden))

const shouldShowActions = computed(() => hasVisiblePrimaryActions.value || resolvedMoreMenuActions.value.length > 0)

const installProgressState = computed(() => {
  const action = resolvedPrimaryActions.value.find(
    (action) => !action.hidden && action.type === 'install' && 'state' in action && action.state === 'pending',
  )

  if (!action) {
    return undefined
  }

  const progress = 'progress' in action ? action.progress : undefined

  return {
    isIndeterminate: typeof progress !== 'number',
    style: typeof progress === 'number' ? { width: `${Math.min(100, Math.max(0, progress))}%` } : undefined,
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
</script>

<template>
  <div class="tr-extension-card">
    <div class="tr-extension-card__icon-region">
      <slot name="icon">
        <img v-if="item.icon" :src="item.icon" :alt="item.name" class="tr-extension-card__icon" />
        <div v-else class="tr-extension-card__icon tr-extension-card__icon--placeholder">
          {{ item.name.slice(0, 1) }}
        </div>
      </slot>
    </div>

    <div class="tr-extension-card__content">
      <div
        class="tr-extension-card__name"
        :class="{ 'is-clickable': nameClickable }"
        :role="nameClickable ? 'button' : undefined"
        :tabindex="nameClickable ? 0 : undefined"
        :title="item.name"
        @click="handleNameClick"
        @keydown="handleNameKeydown"
      >
        {{ item.name }}
      </div>
      <div v-if="item.description" class="tr-extension-card__description" :title="item.description">
        {{ item.description }}
      </div>
    </div>

    <div v-if="shouldShowActions" class="tr-extension-card__actions" @click.stop @keydown.stop>
      <ExtensionCardPrimaryActions
        v-if="hasVisiblePrimaryActions"
        :actions="resolvedPrimaryActions"
        @action="emit('action', $event)"
      >
        <template #custom-action="{ action, trigger }">
          <slot name="custom-action" :action="action" :trigger="trigger" />
        </template>
      </ExtensionCardPrimaryActions>

      <ExtensionCardMoreMenu
        v-if="resolvedMoreMenuActions.length"
        :actions="resolvedMoreMenuActions"
        :trigger-aria-label="moreMenuTriggerAriaLabel"
        :placement="moreMenuPlacement"
        @action="emit('action', { id: $event.id })"
      />
    </div>

    <div v-if="installProgressState" class="tr-extension-card__progress">
      <span
        class="tr-extension-card__progress-bar"
        :class="{ 'is-indeterminate': installProgressState.isIndeterminate }"
        :style="installProgressState.style"
      ></span>
    </div>
  </div>
</template>

<style lang="less">
:root {
  --tr-extension-card-bg-color: #f8f8f8;
  --tr-extension-card-bg-color-hover: rgba(0, 0, 0, 0.04);
  --tr-extension-card-focus-color: #191919;
  --tr-extension-card-icon-color: #808080;
}
</style>

<style lang="less" scoped>
.tr-extension-card {
  --tr-extension-card-install-button-border-color: var(--tr-border-color-default);
  --tr-extension-card-install-button-text-color: var(--tr-text-primary);
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
