<script setup lang="ts">
import type { ExtensionCardActionEvent, ExtensionRecord, ExtensionSource } from '@opentiny/tiny-robot'
import { ExtensionManager, useExtensionManagerContext } from '@opentiny/tiny-robot'
import { IconArrowDown, IconPlus } from '@opentiny/tiny-robot-svgs'

const manager = useExtensionManagerContext()
const sources: ExtensionSource[] = ['installed', 'market']

const getItems = (source: ExtensionSource) => {
  return source === 'installed' ? manager.installedItems.value : manager.marketItems.value
}

const getSectionTitle = (source: ExtensionSource) => {
  const typeLabel = manager.typeOptions.value.find((option) => option.value === manager.activeType.value)?.label
  return `${source === 'installed' ? '已添加' : '市场'}${typeLabel ?? manager.activeType.value}`
}

const handleCardAction = (item: ExtensionRecord, source: ExtensionSource, event: ExtensionCardActionEvent) => {
  if (event.id === 'toggle' && typeof event.checked === 'boolean') {
    manager.requestToggle(item, event.checked, source)
  } else if (event.id === 'add') {
    manager.requestAdd(item, source)
  } else if (event.id === 'delete') {
    manager.requestDelete(item, source)
  }
}
</script>

<template>
  <div class="composed-extension-manager">
    <header class="composed-extension-manager__header">
      <strong>服务列表</strong>
      <button class="composed-extension-manager__create" type="button" @click="manager.requestCreate()">
        <IconPlus />
        添加自定义服务
      </button>
    </header>

    <nav class="composed-extension-manager__tabs" aria-label="扩展类型">
      <button
        v-for="option in manager.typeOptions.value"
        :key="option.value"
        class="composed-extension-manager__tab"
        :class="{ 'is-active': manager.activeType.value === option.value }"
        type="button"
        @click="manager.setActiveType(option.value)"
      >
        {{ option.label }}
      </button>
    </nav>

    <div class="composed-extension-manager__sections">
      <section v-for="source in sources" :key="source" class="composed-extension-manager__section">
        <button
          class="composed-extension-manager__section-title"
          type="button"
          :aria-expanded="manager.isSectionExpanded(source)"
          @click="manager.toggleSection(source)"
        >
          <IconArrowDown
            class="composed-extension-manager__section-arrow"
            :class="{ 'is-expanded': manager.isSectionExpanded(source) }"
          />
          <span>{{ getSectionTitle(source) }}</span>
        </button>

        <div v-show="manager.isSectionExpanded(source)" class="composed-extension-manager__section-body">
          <ExtensionManager.List
            :source="source"
            :items="getItems(source)"
            :operation-states="manager.operationStates.value"
            :empty-text="source === 'installed' ? '暂无已添加扩展' : '暂无市场扩展'"
          >
            <ExtensionManager.Card
              v-for="item in getItems(source)"
              :key="item.id"
              :item="item"
              @name-click="manager.requestDetailOpen(item, source)"
              @action="handleCardAction(item, source, $event)"
            />
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
