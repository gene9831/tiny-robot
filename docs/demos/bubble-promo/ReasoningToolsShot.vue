<template>
  <section class="reasoning-shot">
    <header class="shot-header">
      <div>
        <p class="eyebrow">Reasoning + Tool Calls</p>
        <h2>把模型思考过程和工具调用展示给用户</h2>
      </div>
      <button @click="replay">重放状态</button>
    </header>

    <main class="content-grid">
      <tr-bubble
        :content="answer"
        :reasoning_content="reasoningContent"
        :avatar="aiAvatar"
        :state="reasoningState"
        @state-change="handleReasoningStateChange"
      />

      <div ref="toolPanelRef" class="tool-panel">
        <tr-bubble-provider :store="bubbleStore">
          <tr-bubble
            content="我会先查询工单，再计算 SLA 风险等级。"
            :tool_calls="toolCalls"
            :avatar="aiAvatar"
            :state="toolState"
            @state-change="handleToolStateChange"
          />
        </tr-bubble-provider>
      </div>
    </main>
  </section>
</template>

<script setup lang="ts">
import { TrBubble, TrBubbleProvider } from '@opentiny/tiny-robot'
import { IconAi } from '@opentiny/tiny-robot-svgs'
import { h, nextTick, onMounted, reactive, ref } from 'vue'

const aiAvatar = h(IconAi, { style: { fontSize: '32px' } })

const finalReasoning =
  '用户希望了解当前 P1 工单是否存在超时风险。我需要先读取工单状态，再结合 SLA 剩余时间、处理人和最近一次更新时间判断风险等级。'
const finalAnswer = '当前工单存在中等 SLA 风险，建议优先通知处理人，并在 30 分钟内完成审批动作。'

const reasoningContent = ref(finalReasoning)
const answer = ref(finalAnswer)
const reasoningState = ref<Record<string, unknown>>({
  thinking: false,
  open: true,
})

const toolPanelRef = ref<HTMLDivElement | null>(null)

const toolCalls = ref([
  {
    id: 'call_ticket',
    type: 'function',
    function: {
      name: 'get_ticket_detail',
      arguments: '',
    },
  },
  {
    id: 'call_sla',
    type: 'function',
    function: {
      name: 'calculate_sla_risk',
      arguments: '',
    },
  },
])

const finalToolArguments = {
  call_ticket: '{"ticketId":"INC-2026-0428","includeTimeline":true}',
  call_sla: '{"priority":"P1","remainingMinutes":42}',
}

const finalToolResults = {
  call_ticket: JSON.stringify({
    ticketId: 'INC-2026-0428',
    title: '账号权限申请审批超时',
    priority: 'P1',
    assignee: 'Lina Chen',
    status: 'waiting_approval',
    updatedAt: '2026-04-28 10:42:16',
  }),
  call_sla: JSON.stringify({
    error: {
      code: 'SLA_RULE_TIMEOUT',
      message: 'SLA 规则服务响应超时，请稍后重试或切换备用规则集。',
    },
    fallback: {
      level: 'medium',
      remainingMinutes: 42,
    },
  }),
}

toolCalls.value[0]!.function.arguments = finalToolArguments.call_ticket
toolCalls.value[1]!.function.arguments = finalToolArguments.call_sla

const bubbleStore = reactive({
  toolCallResults: {
    call_ticket: finalToolResults.call_ticket,
    call_sla: finalToolResults.call_sla,
  },
})

const toolState = ref<{
  toolCall: Record<string, { status?: string; open?: boolean }>
}>({
  toolCall: {
    call_ticket: { status: 'success', open: true },
    call_sla: { status: 'failed', open: true },
  },
})

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function scrollToolPanelToBottom() {
  await nextTick()
  const panel = toolPanelRef.value
  if (!panel) {
    return
  }

  panel.scrollTo({
    top: panel.scrollHeight,
    behavior: 'smooth',
  })
}

async function streamText(
  setter: (value: string) => void,
  text: string,
  delay = 18,
  afterUpdate?: () => Promise<void>,
) {
  let value = ''
  setter(value)
  await afterUpdate?.()

  for (const char of text) {
    value += char
    setter(value)
    await afterUpdate?.()
    await sleep(delay)
  }
}

async function replay() {
  reasoningContent.value = ''
  answer.value = ''
  reasoningState.value = { thinking: true, open: true }
  toolState.value.toolCall.call_ticket = { status: 'running', open: true }
  toolState.value.toolCall.call_sla = { status: 'running', open: true }
  toolCalls.value[0]!.function.arguments = ''
  toolCalls.value[1]!.function.arguments = ''
  bubbleStore.toolCallResults.call_ticket = ''
  bubbleStore.toolCallResults.call_sla = ''
  await scrollToolPanelToBottom()

  await sleep(500)

  await Promise.all([replayReasoning(), replayTools()])
}

async function replayReasoning() {
  await streamText(
    (value) => {
      reasoningContent.value = value
    },
    finalReasoning,
    12,
  )

  reasoningState.value.thinking = false
  await sleep(220)

  await streamText(
    (value) => {
      answer.value = value
    },
    finalAnswer,
    18,
  )
}

async function replayTools() {
  await streamText(
    (value) => {
      toolCalls.value[0]!.function.arguments = value
    },
    finalToolArguments.call_ticket,
    18,
    scrollToolPanelToBottom,
  )
  await streamText(
    (value) => {
      bubbleStore.toolCallResults.call_ticket = value
    },
    finalToolResults.call_ticket,
    18,
    scrollToolPanelToBottom,
  )
  toolState.value.toolCall.call_ticket.status = 'success'
  await scrollToolPanelToBottom()

  await sleep(360)

  await streamText(
    (value) => {
      toolCalls.value[1]!.function.arguments = value
    },
    finalToolArguments.call_sla,
    18,
    scrollToolPanelToBottom,
  )
  await streamText(
    (value) => {
      bubbleStore.toolCallResults.call_sla = value
    },
    finalToolResults.call_sla,
    18,
    scrollToolPanelToBottom,
  )
  toolState.value.toolCall.call_sla.status = 'failed'
  await scrollToolPanelToBottom()
}

onMounted(() => {
  window.setTimeout(() => {
    replay()
  }, 500)
})

function handleReasoningStateChange(payload: { key: string; value: unknown }) {
  reasoningState.value[payload.key] = payload.value
}

function handleToolStateChange(payload: { key: string; value: unknown }) {
  if (payload.key === 'toolCall') {
    toolState.value.toolCall = payload.value as typeof toolState.value.toolCall
  }
}
</script>

<style scoped>
.reasoning-shot {
  box-sizing: border-box;
  width: 960px;
  min-height: 640px;
  padding: 28px;
  background: #f6f8fb;
  color: #172033;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}

.shot-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #7c3aed;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
}

h2 {
  max-width: 560px;
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
}

button {
  border: 1px solid #d8dff0;
  border-radius: 6px;
  background: #ffffff;
  color: #334155;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  padding: 9px 12px;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  align-items: start;
}

.content-grid > :deep(.tr-bubble),
.tool-panel {
  min-height: 500px;
  padding: 22px;
  border: 1px solid #dfe7f4;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 16px 38px rgba(31, 48, 78, 0.1);
}

.tool-panel {
  box-sizing: border-box;
  height: 500px;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scroll-behavior: smooth;
}

.tool-panel :deep(.tr-bubble) {
  min-height: 0;
}

.content-grid :deep([data-role='assistant']),
.content-grid :deep(.tr-bubble) {
  --tr-bubble-max-width: 100%;
  --tr-bubble-box-bg: #ffffff;
  --tr-bubble-box-border: 1px solid #e4eaf4;
  --tr-bubble-text-line-height: 1.7;
  --tr-bubble-tool-call-max-width: 100%;
  --tr-bubble-tool-call-max-height: 260px;
  --tr-bubble-reasoning-max-height: 260px;
}
</style>
