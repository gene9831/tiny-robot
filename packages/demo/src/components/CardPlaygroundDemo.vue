<script setup lang="ts">
import type {
  ExtensionCardAction,
  ExtensionCardActionEvent,
  ExtensionCardOverflowMenuPlacement,
} from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'
import { IconEditPen, IconSparkles } from '@opentiny/tiny-robot-svgs'
import { computed, ref } from 'vue'

type ProgressMode = 'hidden' | 'determinate' | 'indeterminate'

const primaryActionsLimit = ref(2)
const progressMode = ref<ProgressMode>('determinate')
const progressValue = ref(68)
const nameClickable = ref(true)
const overflowMenuPlacement = ref<ExtensionCardOverflowMenuPlacement>('bottom-end')
const followUpdates = ref(true)
const latestEvent = ref<ExtensionCardActionEvent | null>(null)

const progress = computed<number | 'indeterminate' | undefined>(() => {
  if (progressMode.value === 'hidden') return undefined
  if (progressMode.value === 'indeterminate') return 'indeterminate'
  return progressValue.value
})

const progressLabel = computed(() => {
  if (progressMode.value === 'hidden') return 'hidden'
  if (progressMode.value === 'indeterminate') return 'working'
  return `${progressValue.value}%`
})

const actions = computed<ExtensionCardAction[]>(() => [
  {
    id: 'follow-updates',
    type: 'switch',
    label: 'Follow updates',
    checked: followUpdates.value,
  },
  {
    id: 'open-library',
    type: 'button',
    label: 'Open library',
    icon: IconEditPen,
  },
  {
    id: 'save-view',
    type: 'custom',
    label: 'Save view',
    data: { surface: 'brand-library' },
  },
  {
    id: 'clear-preview',
    type: 'button',
    label: 'Clear preview',
    danger: true,
  },
])

const latestEventText = computed(() => (latestEvent.value ? JSON.stringify(latestEvent.value) : 'No action yet'))

const handleAction = (event: ExtensionCardActionEvent) => {
  if (event.type === 'switch' && typeof event.checked === 'boolean') followUpdates.value = event.checked
  latestEvent.value = event
}
</script>

<template>
  <section class="card-playground" aria-label="Card composition playground">
    <div class="card-playground__intro">
      <div>
        <div class="card-playground__eyebrow">compose the detail</div>
        <h4>Brand library</h4>
        <p>Keep the inputs close, then see the same Card respond in real time.</p>
      </div>
      <span class="card-playground__badge">local state</span>
    </div>

    <div class="card-playground__surface">
      <aside class="card-playground__controls" aria-label="Playground controls">
        <div class="card-playground__controls-heading">
          <strong>Tune the inputs</strong>
          <span>direct props</span>
        </div>

        <label class="card-playground__field">
          <span>Primary actions</span>
          <select v-model.number="primaryActionsLimit" data-testid="card-playground-primary-actions-limit">
            <option :value="0">0 visible</option>
            <option :value="1">1 visible</option>
            <option :value="2">2 visible</option>
            <option :value="3">3 visible</option>
          </select>
        </label>

        <label class="card-playground__field">
          <span>Progress mode</span>
          <select v-model="progressMode" data-testid="card-playground-progress-mode">
            <option value="hidden">hidden</option>
            <option value="determinate">determinate</option>
            <option value="indeterminate">indeterminate</option>
          </select>
        </label>

        <label class="card-playground__field">
          <span>Progress value</span>
          <span class="card-playground__input-wrap">
            <input
              v-model.number="progressValue"
              data-testid="card-playground-progress-value"
              type="number"
              min="0"
              max="100"
              :disabled="progressMode !== 'determinate'"
            />
            <span>%</span>
          </span>
        </label>

        <label class="card-playground__check">
          <input v-model="nameClickable" data-testid="card-playground-name-clickable" type="checkbox" />
          <span>Name is clickable</span>
        </label>

        <label class="card-playground__field">
          <span>Overflow placement</span>
          <select v-model="overflowMenuPlacement" data-testid="card-playground-overflow-placement">
            <option value="bottom-end">bottom-end</option>
            <option value="top-end">top-end</option>
          </select>
        </label>

        <div class="card-playground__divider"></div>

        <label class="card-playground__check card-playground__check--switch">
          <input v-model="followUpdates" data-testid="card-playground-switch-value" type="checkbox" />
          <span>Follow updates</span>
          <span class="card-playground__state">{{ followUpdates ? 'on' : 'off' }}</span>
        </label>
      </aside>

      <div class="card-playground__result">
        <div class="card-playground__result-heading">
          <strong>Live preview</strong>
          <span>progress {{ progressLabel }}</span>
        </div>

        <div class="card-playground__preview">
          <ExtensionManager.Card
            data-testid="card-playground-preview"
            name="Brand library"
            description="A calm collection for keeping useful references close."
            :icon="IconSparkles"
            :actions="actions"
            :primary-actions-limit="primaryActionsLimit"
            :progress="progress"
            :name-clickable="nameClickable"
            overflow-menu-label="More options"
            :overflow-menu-placement="overflowMenuPlacement"
            @action="handleAction"
          />
        </div>

        <div class="card-playground__event" aria-live="polite">
          <div class="card-playground__event-label">Latest action event</div>
          <code data-testid="card-playground-latest-event">{{ latestEventText }}</code>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.card-playground {
  padding: 20px;
  border: 1px solid #d8e6f8;
  border-radius: 16px;
  background: linear-gradient(135deg, #eef5ff 0%, #fff 62%, #effbf7 100%);
}

.card-playground__intro {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.card-playground__eyebrow {
  margin-bottom: 6px;
  color: #607ce9;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.card-playground__intro h4 {
  margin: 0;
  color: #253a60;
  font-size: 18px;
  letter-spacing: -0.03em;
}

.card-playground__intro p {
  margin: 6px 0 0;
  color: #7185a5;
  font-size: 11px;
  line-height: 1.5;
}

.card-playground__badge {
  flex: 0 0 auto;
  padding: 5px 8px;
  border-radius: 999px;
  background: #dff6ee;
  color: #3d8d7a;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.card-playground__surface {
  display: grid;
  grid-template-columns: minmax(190px, 0.72fr) minmax(0, 1.28fr);
  gap: 14px;
  padding: 12px;
  border: 1px solid #dce8f8;
  border-radius: 14px;
  background: rgb(255 255 255 / 84%);
}

.card-playground__controls,
.card-playground__result {
  min-width: 0;
  border-radius: 12px;
}

.card-playground__controls {
  display: flex;
  flex-direction: column;
  gap: 11px;
  padding: 15px;
  border: 1px solid #e1eafa;
  background: #f7faff;
}

.card-playground__controls-heading,
.card-playground__result-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.card-playground__controls-heading {
  padding-bottom: 3px;
  color: #2e4774;
  font-size: 12px;
}

.card-playground__controls-heading span,
.card-playground__result-heading span {
  color: #8aa0c2;
  font-size: 10px;
}

.card-playground__field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #7185a5;
  font-size: 11px;
}

.card-playground__field select,
.card-playground__input-wrap input {
  box-sizing: border-box;
  min-width: 0;
  height: 28px;
  border: 1px solid #d5e1f2;
  border-radius: 7px;
  background: #fff;
  color: #526fe4;
  font-size: 11px;
}

.card-playground__field select {
  width: 118px;
  padding: 0 6px;
}

.card-playground__input-wrap {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #8aa0c2;
}

.card-playground__input-wrap input {
  width: 62px;
  padding: 0 7px;
}

.card-playground__input-wrap input:disabled {
  background: #f0f4fa;
  color: #9aaac1;
}

.card-playground__check {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #7185a5;
  font-size: 11px;
}

.card-playground__check input {
  accent-color: #526fe4;
}

.card-playground__check--switch {
  justify-content: flex-start;
}

.card-playground__state {
  margin-left: auto;
  padding: 3px 6px;
  border-radius: 999px;
  background: #e3f7f0;
  color: #3d8d7a;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
}

.card-playground__divider {
  height: 1px;
  margin: 1px 0;
  background: #e4ecf8;
}

.card-playground__result {
  display: flex;
  flex-direction: column;
  gap: 11px;
  padding: 15px;
  border: 1px solid #e1eafa;
  background: #fff;
}

.card-playground__result-heading {
  color: #2e4774;
  font-size: 12px;
}

.card-playground__preview {
  --tr-extension-card-bg-color: #fff;
  --tr-extension-card-bg-color-hover: #eef3ff;
  --tr-extension-card-focus-color: #526fe4;
  --tr-extension-card-progress-bar-color: #68cdb2;

  padding: 18px;
  border: 1px solid #dfe9f7;
  border-radius: 12px;
  background: #f7faff;
}

.card-playground__preview :deep(.tr-extension-card) {
  min-height: 92px;
  border: 1px solid #e1eafa;
  border-radius: 14px;
  box-shadow: 0 10px 24px rgb(66 99 151 / 10%);
}

.card-playground__event {
  display: grid;
  gap: 6px;
  padding: 10px 11px;
  border: 1px solid #d9eee7;
  border-radius: 9px;
  background: #f2fbf7;
}

.card-playground__event-label {
  color: #3d8d7a;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.card-playground__event code {
  overflow-wrap: anywhere;
  color: #61779a;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  line-height: 1.45;
}

@media (max-width: 760px) {
  .card-playground {
    padding: 14px;
  }

  .card-playground__surface {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 460px) {
  .card-playground__intro {
    flex-direction: column;
    gap: 10px;
  }

  .card-playground__field {
    align-items: flex-start;
    flex-direction: column;
    gap: 5px;
  }

  .card-playground__field select {
    width: 100%;
  }
}
</style>
