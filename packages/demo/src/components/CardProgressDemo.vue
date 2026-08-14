<script setup lang="ts">
import { ExtensionManager } from '@opentiny/tiny-robot'
import { computed, ref } from 'vue'

type ProgressMode = 'hidden' | 'determinate' | 'indeterminate'

const mode = ref<ProgressMode>('determinate')
const value = ref(65)

const progress = computed<number | 'indeterminate' | undefined>(() => {
  if (mode.value === 'hidden') return undefined
  if (mode.value === 'indeterminate') return 'indeterminate'
  return value.value
})

const statusLabel = computed(() => {
  if (mode.value === 'hidden') return 'Complete'
  if (mode.value === 'indeterminate') return 'Working'
  return 'Ready'
})
</script>

<template>
  <article class="card-pattern">
    <div class="card-pattern__tag">03 / signal</div>
    <h4>Progress</h4>
    <p class="card-pattern__description">
      Progress is an independent signal; the caller decides what the surrounding state means.
    </p>

    <div class="card-pattern__preview">
      <ExtensionManager.Card
        data-testid="card-progress-preview"
        name="Preparing a research brief"
        description="The progress bar can be determinate, indeterminate, or omitted."
        :progress="progress"
      />
    </div>

    <div class="card-pattern__controls">
      <label
        >Mode
        <select v-model="mode">
          <option value="hidden">hidden</option>
          <option value="determinate">determinate</option>
          <option value="indeterminate">indeterminate</option>
        </select></label
      >
      <label
        >Value <input v-model.number="value" type="number" min="0" max="100" :disabled="mode !== 'determinate'"
      /></label>
      <span class="card-pattern__status">{{ statusLabel }}</span>
    </div>
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
  align-items: center;
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
.card-pattern__controls select,
.card-pattern__controls input {
  height: 24px;
  border: 1px solid #d6e2f2;
  border-radius: 6px;
  color: #536fe0;
  font-size: 11px;
}
.card-pattern__status {
  padding: 4px 7px;
  border-radius: 99px;
  background: #e4f6f0;
  color: #3d8d7a;
  font-weight: 800;
}
</style>
