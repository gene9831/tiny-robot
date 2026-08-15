<script setup lang="ts">
import { ExtensionManager } from '@opentiny/tiny-robot'
import { IconDelete, IconEditPen } from '@opentiny/tiny-robot-svgs'
import { markRaw } from 'vue'

const editIcon = markRaw(IconEditPen)
const deleteIcon = markRaw(IconDelete)

const actions = [
  { id: 'edit', type: 'button' as const, label: '编辑', icon: editIcon },
  { id: 'remove', type: 'button' as const, label: '移除', icon: deleteIcon, danger: true },
]
</script>

<template>
  <ExtensionManager.Card
    name="Overflow icon policy"
    description="The menu can keep labels and events while omitting every action icon and icon slot."
    :actions="actions"
    :primary-actions-limit="0"
    overflow-menu-label="无图标溢出菜单"
    :overflow-menu-show-icons="false"
  />
</template>
