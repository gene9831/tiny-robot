<script setup lang="ts">
import type { ExtensionCardAction, ExtensionCardActionEvent } from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'
import { computed, ref } from 'vue'

const useSlot = ref(true)
const latestEvent = ref('No action yet')
const actions = computed<ExtensionCardAction[]>(() => [
  { id: 'annotate', type: 'custom', label: 'Add annotation', data: { source: 'meeting-notes' } },
])

const handleAction = (event: ExtensionCardActionEvent) => {
  latestEvent.value = JSON.stringify(event)
}
</script>

<template>
  <article class="card-pattern">
    <div class="card-pattern__tag">04 / custom</div>
    <h4>Bring your trigger</h4>
    <p class="card-pattern__description">
      Use the primary-action slot for a custom trigger, or let Card fall back to a normal button.
    </p>

    <div class="card-pattern__preview">
      <ExtensionManager.Card
        data-testid="card-custom-preview"
        name="Meeting notes"
        description="A custom trigger can still emit the same action event shape."
        :actions="actions"
        @action="handleAction"
      >
        <template v-if="useSlot" #primary-action="{ action, trigger }">
          <button
            class="card-custom-action"
            type="button"
            :aria-label="action.label"
            @click="trigger({ source: 'primary-slot' })"
          >
            Add note
          </button>
        </template>
      </ExtensionManager.Card>
    </div>

    <div class="card-pattern__controls">
      <label><input v-model="useSlot" type="checkbox" /> Use primary-action slot</label>
    </div>
    <code class="card-pattern__event">{{ latestEvent }}</code>
  </article>
</template>

<style scoped>
.card-pattern {
  min-width: 0;
  padding: 16px;
  border: 1px solid #dfe9f7;
  border-radius: 16px;
  background: #fff;
}
.card-pattern__tag {
  display: inline-flex;
  padding: 4px 7px;
  border-radius: 99px;
  background: #f0f4ff;
  color: #647be1;
  font-size: 9px;
  font-weight: 800;
}
.card-pattern h4 {
  margin: 23px 0 5px;
  color: #263c63;
  font-size: 16px;
}
.card-pattern__description {
  min-height: 36px;
  margin: 0;
  color: #7b8daa;
  font-size: 11px;
  line-height: 1.5;
}
.card-pattern__preview {
  margin-top: 14px;
  overflow: hidden;
  border-radius: 12px;
}
.card-pattern__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 9px 12px;
  margin-top: 12px;
  color: #7185a5;
  font-size: 11px;
}
.card-pattern__controls label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.card-pattern__event {
  display: block;
  overflow: hidden;
  margin-top: 12px;
  padding: 8px 9px;
  border-radius: 8px;
  background: #f4f8ff;
  color: #61779a;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-custom-action {
  min-width: 84px;
  height: 30px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: #526fe4;
  color: #fff;
  cursor: pointer;
  font-size: 11px;
}
</style>
