<script setup lang="ts">
import type { ExtensionCardAction } from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'
import { IconDelete, IconEditPen, IconSparkles } from '@opentiny/tiny-robot-svgs'
import { markRaw } from 'vue'

const sparklesIcon = markRaw(IconSparkles)
const editIcon = markRaw(IconEditPen)
const deleteIcon = markRaw(IconDelete)

const actions: ExtensionCardAction[] = [
  { id: 'enabled', type: 'switch', label: '启用扩展', checked: true, icon: sparklesIcon },
  { id: 'configure', type: 'button', label: '配置', icon: editIcon },
  { id: 'inspect', type: 'custom', label: '检查', data: { origin: 'storybook' } },
  { id: 'delete', type: 'button', label: '删除', icon: deleteIcon, danger: true },
  { id: 'hidden', type: 'button', label: '隐藏操作', hidden: true },
  { id: 'disabled', type: 'button', label: '暂不可用', disabled: true },
]
</script>

<template>
  <ExtensionManager.Card
    name="Action states"
    description="Hidden actions are removed before partitioning; disabled and danger states remain visible."
    :icon="sparklesIcon"
    :actions="actions"
    :primary-actions-limit="2"
    overflow-menu-label="扩展操作"
  />
</template>
