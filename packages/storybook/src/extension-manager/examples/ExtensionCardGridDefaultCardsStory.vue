<script setup lang="ts">
import type { ExtensionCardGridItem } from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'
import { IconEditPen, IconSparkles } from '@opentiny/tiny-robot-svgs'
import { markRaw } from 'vue'

const editIcon = markRaw(IconEditPen)
const sparklesIcon = markRaw(IconSparkles)

const items: ExtensionCardGridItem[] = [
  {
    id: 'alpha',
    name: 'Alpha extension',
    description: 'Alpha description',
    icon: 'https://cdn.jsdelivr.net/npm/remixicon@4.9.1/icons/Development/puzzle-line.svg',
    actions: [
      { id: 'toggle-alpha', type: 'switch', label: 'Enable Alpha', checked: true, icon: sparklesIcon },
      { id: 'install-alpha', type: 'button', label: 'Install Alpha', icon: editIcon },
      { id: 'inspect-alpha', type: 'custom', label: 'Inspect Alpha', data: { origin: 'storybook' } },
    ],
    progress: 75,
  },
  {
    id: 'beta',
    name: 'Beta extension',
    description: 'Beta description',
    nameClickable: false,
  },
]
</script>

<template>
  <ExtensionManager.CardGrid
    :items="items"
    empty-text="暂无内容"
    :primary-actions-limit="1"
    :name-clickable="true"
    overflow-menu-label="更多操作"
    overflow-menu-placement="top-end"
    :overflow-menu-show-icons="false"
  />
</template>
