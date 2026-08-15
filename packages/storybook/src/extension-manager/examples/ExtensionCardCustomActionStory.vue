<script setup lang="ts">
import type { ExtensionCardAction, ExtensionCardActionEvent } from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'
import { ref } from 'vue'

const action: ExtensionCardAction = {
  id: 'preview',
  type: 'custom',
  label: '预览扩展',
  data: { source: 'custom-slot-story' },
}

const lastEvent = ref<ExtensionCardActionEvent>()

const handleAction = (event: ExtensionCardActionEvent) => {
  lastEvent.value = event
}
</script>

<template>
  <div class="storybook-custom-action-story">
    <ExtensionManager.Card
      name="Custom primary action"
      description="The primary-action slot owns the custom control while Card owns the unified event shape."
      :actions="[action]"
      :primary-actions-limit="1"
      @action="handleAction"
    >
      <template #primary-action="{ action: slotAction, trigger }">
        <button
          class="storybook-custom-action-story__button"
          type="button"
          :disabled="slotAction.disabled"
          @click="trigger({ origin: 'storybook' })"
        >
          {{ slotAction.label }}
        </button>
      </template>
    </ExtensionManager.Card>

    <output class="storybook-event-output">{{ JSON.stringify(lastEvent) }}</output>
  </div>
</template>

<style scoped>
.storybook-custom-action-story {
  display: grid;
  gap: 12px;
  width: min(720px, 90vw);
}

.storybook-custom-action-story__button {
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid #607ce9;
  border-radius: 6px;
  background: #607ce9;
  color: #fff;
  cursor: pointer;
  font: inherit;
}

.storybook-custom-action-story__button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.storybook-event-output {
  padding: 8px 10px;
  border-radius: 6px;
  background: #f1f5ff;
  color: #52607a;
  font:
    12px/1.5 ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
  overflow-wrap: anywhere;
}
</style>
