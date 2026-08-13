<script setup lang="ts">
import { computed } from 'vue'
import type { ExtensionContext, ExtensionKind, ExtensionScope } from '@opentiny/tiny-robot'
import { ExtensionManager, useExtensionContext } from '@opentiny/tiny-robot'
import { IconArrowDown, IconPlus } from '@opentiny/tiny-robot-svgs'

const props = defineProps<{
  activeKind?: ExtensionKind
}>()

const emit = defineEmits<{
  (e: 'update:active-kind', kind: ExtensionKind): void
}>()

const manager: ExtensionContext = useExtensionContext()
const scopes: ExtensionScope[] = ['installed', 'available']
const kindOptions = computed(() => {
  const seenKinds = new Set<ExtensionKind>()

  return manager.allExtensions.value.flatMap((item) => {
    if (seenKinds.has(item.kind)) return []
    seenKinds.add(item.kind)
    return [{ value: item.kind, label: item.kind }]
  })
})

const selectedKind = computed(() => {
  if (props.activeKind && kindOptions.value.some((option) => option.value === props.activeKind)) {
    return props.activeKind
  }

  return kindOptions.value[0]?.value
})

const getItems = (scope: ExtensionScope) => {
  return manager.displayItems.value[scope]
}

const getSectionTitle = (scope: ExtensionScope) => {
  const kindLabel = kindOptions.value.find((option) => option.value === selectedKind.value)?.label ?? selectedKind.value
  return `${scope === 'installed' ? '已添加' : '可用'}${kindLabel ?? ''}`
}

const handleCreate = () => {
  if (selectedKind.value) manager.requestCreate(selectedKind.value)
}
</script>

<template>
  <div class="composed-extension-manager">
    <header class="composed-extension-manager__header">
      <strong>服务列表</strong>
      <button class="composed-extension-manager__create" type="button" :disabled="!selectedKind" @click="handleCreate">
        <IconPlus />
        添加自定义服务
      </button>
    </header>

    <nav class="composed-extension-manager__tabs" aria-label="扩展类型">
      <button
        v-for="option in kindOptions"
        :key="option.value"
        class="composed-extension-manager__tab"
        :class="{ 'is-active': selectedKind === option.value }"
        type="button"
        @click="emit('update:active-kind', option.value)"
      >
        {{ option.label }}
      </button>
    </nav>

    <div class="composed-extension-manager__sections">
      <section v-for="scope in scopes" :key="scope" class="composed-extension-manager__section">
        <button
          class="composed-extension-manager__section-title"
          type="button"
          :aria-expanded="manager.isSectionExpanded(scope)"
          @click="manager.toggleSection(scope)"
        >
          <IconArrowDown
            class="composed-extension-manager__section-arrow"
            :class="{ 'is-expanded': manager.isSectionExpanded(scope) }"
          />
          <span>{{ getSectionTitle(scope) }}</span>
        </button>

        <div v-show="manager.isSectionExpanded(scope)" class="composed-extension-manager__section-body">
          <ExtensionManager.List
            :scope="scope"
            :items="getItems(scope)"
            :empty-text="scope === 'installed' ? '暂无已添加扩展' : '暂无可用扩展'"
            @retry="manager.requestRefresh(scope)"
          >
            <!-- Root/List Card integration is paused until an Extension-to-Card adapter is designed. -->
          </ExtensionManager.List>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.composed-extension-manager {
  box-sizing: border-box;
  width: 100%;
  padding: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
}

.composed-extension-manager__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.composed-extension-manager__create {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  border: 1px solid #d0d5dd;
  border-radius: 999px;
  background: #fff;
  cursor: pointer;
}

.composed-extension-manager__create svg {
  width: 16px;
  height: 16px;
}

.composed-extension-manager__tabs {
  display: flex;
  gap: 28px;
  border-bottom: 1px solid #e5e7eb;
}

.composed-extension-manager__tab {
  padding: 0 0 10px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  cursor: pointer;
}

.composed-extension-manager__tab.is-active {
  border-bottom-color: #191919;
  font-weight: 600;
}

.composed-extension-manager__sections {
  display: grid;
  gap: 16px;
}

.composed-extension-manager__section-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #1f2937;
  cursor: pointer;
  font-size: 14px;
  line-height: 22px;
}

.composed-extension-manager__section-arrow {
  display: inline-block;
  color: #98a2b3;
  font-size: 16px;
  transform: rotate(-90deg);
  transition: transform 0.2s ease;
}

.composed-extension-manager__section-arrow.is-expanded {
  transform: rotate(0);
}
</style>
