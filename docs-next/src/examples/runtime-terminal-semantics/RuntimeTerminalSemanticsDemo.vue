<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { createRuntime, type RuntimeSnapshot, type TinyRobotRuntime } from '@opentiny/tiny-robot-runtime'
import { selectConversation } from '@opentiny/tiny-robot-runtime/selectors'
import {
  createTerminalScenarioRegistration,
  TERMINAL_DEMO_MODEL_ID,
  TERMINAL_SCENARIO_GROUPS,
  TERMINAL_SCENARIOS,
  type TerminalScenarioId,
} from './terminalScenarios'
import {
  createExecutionStage,
  createExecutionTimelinePlayer,
  type ExecutionStage,
  type ExecutionTimelinePlayer,
} from './executionTimeline'

const STAGE_INTERVAL_MS = 600
const PROVIDER_TERMINAL_DELAY_MS = 900

const scenarioId = ref<TerminalScenarioId>('stop')
const running = ref(false)
const timeline = ref<ExecutionStage[]>([])
const snapshotExcerpt = ref('尚未运行')
const currentConversationId = ref<string>()
let runtime: TinyRobotRuntime | undefined
let unsubscribe: (() => void) | undefined
let timelinePlayer: ExecutionTimelinePlayer | undefined
const snapshotsByStage = new Map<string, string>()

const selectedScenario = computed(() => TERMINAL_SCENARIOS.find(({ id }) => id === scenarioId.value)!)
const groupedScenarios = TERMINAL_SCENARIO_GROUPS.map((group) => ({
  ...group,
  scenarios: TERMINAL_SCENARIOS.filter(({ group: groupId }) => groupId === group.id),
}))

function projectSnapshot(snapshot: RuntimeSnapshot, conversationId: string): void {
  const conversation = selectConversation(snapshot, conversationId)
  const turn = conversation?.turns.at(-1)
  const run = conversation?.activeRun ?? turn?.selectedRun ?? turn?.runs.at(-1)
  if (run === undefined) return

  const step = run.steps.at(-1)
  const executionStage = createExecutionStage({
    runStatus: run.status,
    stepStatus: step?.status,
    termination: run.termination,
    errorCode: run.error?.code,
  })

  const assistant = run.messages.find(({ role }) => role === 'assistant')
  snapshotsByStage.set(
    executionStage.key,
    JSON.stringify(
      {
        conversation: {
          id: conversation?.id,
          activeRunId: conversation?.activeRun?.id,
        },
        run: {
          id: run.id,
          status: run.status,
          termination: run.termination,
          error: run.error,
          usage: run.usage,
        },
        step,
        assistantParts: assistant?.parts,
      },
      null,
      2,
    ),
  )
  timelinePlayer?.enqueue(executionStage)
}

async function runScenario(): Promise<void> {
  if (running.value) return

  unsubscribe?.()
  timelinePlayer?.dispose()
  snapshotsByStage.clear()
  const registration = createTerminalScenarioRegistration(scenarioId.value, {
    terminalDelayMs: PROVIDER_TERMINAL_DELAY_MS,
  })
  const currentRuntime = createRuntime({ resolveProvider: () => registration })
  runtime = currentRuntime
  timeline.value = []
  snapshotExcerpt.value = '等待第一个 Runtime 状态…'
  running.value = true
  const currentPlayer = createExecutionTimelinePlayer({
    intervalMs: STAGE_INTERVAL_MS,
    present: (stage) => {
      timeline.value.push(stage)
      snapshotExcerpt.value = snapshotsByStage.get(stage.key) ?? snapshotExcerpt.value
    },
  })
  timelinePlayer = currentPlayer

  unsubscribe = currentRuntime.subscribe((snapshot) => {
    if (currentConversationId.value !== undefined) {
      projectSnapshot(snapshot, currentConversationId.value)
    }
  })
  const conversation = currentRuntime.createConversation()
  currentConversationId.value = conversation.id

  try {
    await conversation.send({
      providerId: registration.providerId,
      modelId: TERMINAL_DEMO_MODEL_ID,
      content: `运行本地场景：${selectedScenario.value.label}`,
    })
  } catch {
    // The normalized terminal is intentionally read from Snapshot below.
  } finally {
    projectSnapshot(currentRuntime.getSnapshot(), conversation.id)
    await currentPlayer.whenIdle()
    if (timelinePlayer === currentPlayer) running.value = false
  }
}

async function stopScenario(): Promise<void> {
  if (runtime === undefined || currentConversationId.value === undefined || !running.value) return
  await runtime.abort(currentConversationId.value)
}

onBeforeUnmount(() => {
  unsubscribe?.()
  timelinePlayer?.dispose()
})
</script>

<template>
  <section class="terminal-demo">
    <div class="terminal-demo__controls">
      <label>
        <span>选择终态场景</span>
        <select v-model="scenarioId" :disabled="running">
          <optgroup v-for="group in groupedScenarios" :key="group.id" :label="group.label">
            <option v-for="scenario in group.scenarios" :key="scenario.id" :value="scenario.id">
              {{ scenario.label }}
            </option>
          </optgroup>
        </select>
      </label>

      <div class="terminal-demo__actions">
        <button type="button" :disabled="running" @click="runScenario">
          {{ running ? '运行中…' : '运行场景' }}
        </button>
        <button
          type="button"
          class="terminal-demo__stop"
          :disabled="!running || scenarioId !== 'abort'"
          @click="stopScenario"
        >
          停止运行
        </button>
      </div>
    </div>

    <div class="terminal-demo__expectation">
      <strong>{{ selectedScenario.description }}</strong>
      <span>预期：{{ selectedScenario.expected }}</span>
    </div>

    <div class="terminal-demo__output" aria-live="polite">
      <section>
        <h3>执行过程</h3>
        <ol v-if="timeline.length">
          <li v-for="stage in timeline" :key="stage.key">
            <strong>{{ stage.title }}</strong>
            <span>{{ stage.detail }}</span>
          </li>
        </ol>
        <p v-else>运行场景后，这里会逐步显示 Runtime 实际观测到的执行阶段。</p>
      </section>

      <section>
        <h3>最终 Snapshot 摘要</h3>
        <pre><code>{{ snapshotExcerpt }}</code></pre>
      </section>
    </div>
  </section>
</template>

<style scoped>
.terminal-demo {
  display: grid;
  gap: 1rem;
  margin: 1.5rem 0;
  padding: 1.25rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}

.terminal-demo__controls,
.terminal-demo__output {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1rem;
}

.terminal-demo label,
.terminal-demo__expectation {
  display: grid;
  gap: 0.45rem;
}

.terminal-demo label span,
.terminal-demo__expectation strong {
  font-weight: 600;
}

.terminal-demo select {
  width: 100%;
  padding: 0.7rem 0.8rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  font: inherit;
}

.terminal-demo__actions {
  display: flex;
  align-items: end;
  gap: 0.75rem;
}

.terminal-demo button {
  padding: 0.65rem 1rem;
  border: 0;
  border-radius: 8px;
  color: var(--vp-button-brand-text);
  background: var(--vp-button-brand-bg);
  font-weight: 600;
  cursor: pointer;
}

.terminal-demo button.terminal-demo__stop {
  color: var(--vp-c-danger-1);
  background: var(--vp-c-danger-soft);
}

.terminal-demo button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.terminal-demo__expectation {
  padding: 0.85rem 1rem;
  border-left: 3px solid var(--vp-c-brand-1);
  background: var(--vp-c-bg);
}

.terminal-demo__expectation span,
.terminal-demo__output p {
  color: var(--vp-c-text-2);
}

.terminal-demo__output section {
  min-width: 0;
  padding-top: 0.5rem;
  border-top: 1px solid var(--vp-c-divider);
}

.terminal-demo__output h3 {
  margin: 0.5rem 0 0.75rem;
  font-size: 1rem;
}

.terminal-demo__output ol {
  margin: 0;
}

.terminal-demo__output li {
  padding: 0.25rem 0 0.65rem;
}

.terminal-demo__output li strong,
.terminal-demo__output li span {
  display: block;
}

.terminal-demo__output li span {
  margin-top: 0.2rem;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
}

.terminal-demo__output pre {
  max-height: 26rem;
  margin: 0;
  overflow: auto;
}

@media (max-width: 720px) {
  .terminal-demo__controls,
  .terminal-demo__output {
    grid-template-columns: 1fr;
  }
}
</style>
