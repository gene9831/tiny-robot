<script setup lang="ts">
import { computed } from 'vue'
import type { McpExtensionDetailEmits, McpExtensionDetailProps, McpExtensionTool } from '../index.type'

const props = defineProps<McpExtensionDetailProps>()
const emit = defineEmits<McpExtensionDetailEmits>()

const tools = computed(() => props.item.metadata?.tools ?? [])

const handleToolToggle = (tool: McpExtensionTool, event: Event) => {
  emit('tool-toggle', tool.id, (event.target as HTMLInputElement).checked)
}
</script>

<template>
  <div class="tr-mcp-extension-detail">
    <div v-if="tools.length" class="tr-mcp-extension-detail__tools">
      <div v-for="tool in tools" :key="tool.id" class="tr-mcp-extension-detail__tool">
        <div class="tr-mcp-extension-detail__tool-content">
          <div class="tr-mcp-extension-detail__tool-name">{{ tool.name }}</div>
          <div v-if="tool.description" class="tr-mcp-extension-detail__tool-description">{{ tool.description }}</div>
        </div>

        <label class="tr-mcp-extension-detail__switch" :aria-label="tool.name">
          <input type="checkbox" :checked="tool.enabled" @change="handleToolToggle(tool, $event)" />
          <span class="tr-mcp-extension-detail__switch-track"></span>
        </label>
      </div>
    </div>
    <div v-else class="tr-mcp-extension-detail__empty">暂无工具</div>
  </div>
</template>

<style lang="less" scoped>
.tr-mcp-extension-detail {
  color: var(--tr-text-primary);
}

.tr-mcp-extension-detail__tools {
  display: flex;
  flex-direction: column;
}

.tr-mcp-extension-detail__tool {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 64px;
  padding: 12px 0;
  border-bottom: 1px solid var(--tr-border-color-divider, #e5e5e5);
}

.tr-mcp-extension-detail__tool:first-child {
  padding-top: 0;
}

.tr-mcp-extension-detail__tool:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.tr-mcp-extension-detail__tool-content {
  flex: 1;
  min-width: 0;
}

.tr-mcp-extension-detail__tool-name {
  overflow: hidden;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tr-mcp-extension-detail__tool-description,
.tr-mcp-extension-detail__empty {
  margin-top: 4px;
  color: var(--tr-text-secondary);
  font-size: 12px;
  line-height: 18px;
}

.tr-mcp-extension-detail__empty {
  margin-top: 0;
}

.tr-mcp-extension-detail__switch {
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  width: 40px;
  height: 22px;
  cursor: pointer;
}

.tr-mcp-extension-detail__switch input {
  position: absolute;
  z-index: 1;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.tr-mcp-extension-detail__switch-track {
  position: relative;
  display: block;
  width: 40px;
  height: 22px;
  border-radius: 999px;
  background: var(--tr-container-bg-hover, #e5e5e5);
  transition: background 0.2s ease;
}

.tr-mcp-extension-detail__switch-track::after {
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

.tr-mcp-extension-detail__switch input:checked + .tr-mcp-extension-detail__switch-track {
  background: var(--tr-color-primary, #191919);
}

.tr-mcp-extension-detail__switch input:checked + .tr-mcp-extension-detail__switch-track::after {
  transform: translateX(18px);
}

.tr-mcp-extension-detail__switch input:focus-visible + .tr-mcp-extension-detail__switch-track {
  outline: 2px solid var(--tr-color-primary, #191919);
  outline-offset: 2px;
}
</style>
