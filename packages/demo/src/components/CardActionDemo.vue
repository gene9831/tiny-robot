<script setup lang="ts">
import type { ExtensionCardAction, ExtensionCardActionEvent } from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'
import { IconDelete, IconEditPen } from '@opentiny/tiny-robot-svgs'
import { computed, ref } from 'vue'

const checked = ref(true)
const primaryActionsLimit = ref(2)
const showCustom = ref(true)
const showDanger = ref(true)
const disableSwitch = ref(false)
const disableButton = ref(false)
const latestEvent = ref('No action yet')

const actions = computed<ExtensionCardAction[]>(() => [
  {
    id: 'focus-mode',
    type: 'switch',
    label: 'Focus mode',
    checked: checked.value,
    disabled: disableSwitch.value,
  },
  {
    id: 'edit-details',
    type: 'button',
    label: 'Edit details',
    icon: IconEditPen,
    disabled: disableButton.value,
  },
  {
    id: 'quick-note',
    type: 'custom',
    label: 'Quick note',
    hidden: !showCustom.value,
    data: { origin: 'action-anatomy' },
  },
  {
    id: 'clear-draft',
    type: 'button',
    label: 'Clear draft',
    icon: IconDelete,
    danger: true,
    hidden: !showDanger.value,
  },
])

const handleAction = (event: ExtensionCardActionEvent) => {
  if (event.type === 'switch' && typeof event.checked === 'boolean') checked.value = event.checked
  latestEvent.value = JSON.stringify(event)
}
</script>

<template>
  <article class="card-pattern">
    <div class="card-pattern__tag">02 / action</div>
    <h4>Action anatomy</h4>
    <p class="card-pattern__description">
      One ordered action array can describe primary, overflow, controlled, and custom behavior.
    </p>

    <div class="card-pattern__preview">
      <ExtensionManager.Card
        data-testid="card-action-preview"
        name="Workspace companion"
        description="A focused set of actions stays close to the surface."
        :actions="actions"
        :primary-actions-limit="primaryActionsLimit"
        overflow-menu-label="More actions"
        @action="handleAction"
      />
    </div>

    <div class="card-pattern__controls">
      <label
        >Primary actions
        <select v-model.number="primaryActionsLimit">
          <option :value="0">0</option>
          <option :value="1">1</option>
          <option :value="2">2</option>
          <option :value="3">3</option>
        </select></label
      >
      <label><input v-model="showCustom" type="checkbox" /> Show custom</label>
      <label><input v-model="showDanger" type="checkbox" /> Show danger</label>
      <label><input v-model="disableSwitch" type="checkbox" /> Disable switch</label>
      <label><input v-model="disableButton" type="checkbox" /> Disable button</label>
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
.card-pattern__controls select {
  height: 24px;
  border: 1px solid #d6e2f2;
  border-radius: 6px;
  color: #536fe0;
  font-size: 11px;
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
</style>
