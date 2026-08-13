<script setup lang="ts">
import type { ExtensionCardAction, ExtensionCardActionEvent } from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'
import { computed, ref } from 'vue'

type InstallPreviewState = 'idle' | 'pending' | 'success'

const installState = ref<InstallPreviewState>('pending')
const progress = ref(45)
const indeterminateProgress = ref(false)
const showInstallAction = ref(true)
const installDisabled = ref(false)
const events = ref<string[]>([])

const installAction = computed<ExtensionCardAction>(() => ({
  id: 'install',
  type: 'button',
  label: installState.value === 'pending' ? '安装中' : installState.value === 'success' ? '已安装' : '安装',
  hidden: !showInstallAction.value,
  disabled: installState.value !== 'idle' || installDisabled.value,
}))

const cardProgress = computed<number | 'indeterminate' | undefined>(() => {
  if (installState.value !== 'pending') return undefined
  return indeterminateProgress.value ? 'indeterminate' : progress.value
})

const logEvent = (message: string) => {
  events.value.unshift(`${new Date().toLocaleTimeString()} ${message}`)
  events.value = events.value.slice(0, 5)
}

const handleAction = (event: ExtensionCardActionEvent) => {
  logEvent(`${event.type}: ${event.id}`)
}
</script>

<template>
  <section class="card-standalone-case">
    <header class="card-standalone-case__header">
      <h4>1.1 Available + Install</h4>
      <p>pending 时 Card 独立接收进度，安装状态由 action label 和 disabled 表示。</p>
    </header>

    <div class="card-install-demo">
      <div class="card-install-demo__controls">
        <label>
          install state
          <select v-model="installState">
            <option value="idle">idle</option>
            <option value="pending">pending</option>
            <option value="success">success</option>
          </select>
        </label>
        <label>
          progress
          <input v-model.number="progress" type="number" min="0" max="100" :disabled="indeterminateProgress" />
        </label>
        <label class="card-install-demo__checkbox">
          <input v-model="indeterminateProgress" type="checkbox" />
          indeterminate progress
        </label>
        <label class="card-install-demo__checkbox">
          <input v-model="showInstallAction" type="checkbox" />
          show action
        </label>
        <label class="card-install-demo__checkbox">
          <input v-model="installDisabled" type="checkbox" />
          disabled
        </label>
      </div>

      <div class="card-standalone-case__preview">
        <ExtensionManager.Card
          name="Standalone 安装示例"
          description="Available Extension 直接由 Card 消费 button action 和 progress。"
          :actions="[installAction]"
          :primary-actions-limit="1"
          :progress="cardProgress"
          @action="handleAction"
        />

        <div class="card-events">
          <strong>Card events</strong>
          <div v-if="events.length" class="event-list">
            <div v-for="event in events" :key="event" class="event-item">{{ event }}</div>
          </div>
          <span v-else>暂无事件。</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.card-standalone-case {
  padding: 16px;
  border: 1px solid #eaecf0;
  border-radius: 8px;
  background: #fcfcfd;
}

.card-standalone-case__header {
  margin-bottom: 14px;
}

.card-standalone-case__header h4 {
  margin: 0 0 6px;
  color: #1f2937;
  font-size: 15px;
}

.card-standalone-case__header p {
  margin: 0;
  color: #667085;
  font-size: 13px;
}

.card-install-demo {
  display: grid;
  gap: 14px;
}

.card-install-demo__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 18px;
  align-items: end;
  padding: 12px 14px;
  border: 1px solid #eaecf0;
  border-radius: 8px;
  background: #fff;
}

.card-install-demo__controls label {
  display: grid;
  gap: 6px;
  color: #344054;
  font-size: 13px;
}

.card-install-demo__controls select,
.card-install-demo__controls input[type='number'] {
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d0d5dd;
  border-radius: 6px;
}

.card-install-demo__checkbox {
  display: inline-flex !important;
  align-items: center;
}

.card-standalone-case__preview {
  display: grid;
  align-content: start;
  gap: 14px;
  min-width: 0;
  padding: 14px;
  border: 1px solid #eaecf0;
  border-radius: 8px;
  background: #fff;
}

.card-events {
  display: grid;
  gap: 8px;
  color: #667085;
  font-size: 13px;
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.event-item {
  padding: 6px 8px;
  border-radius: 6px;
  background: #f8fafc;
  color: #344054;
}
</style>
