import type {
  LanguageModelV4,
  LanguageModelV4CallOptions,
  LanguageModelV4FinishReason,
  LanguageModelV4StreamPart,
  LanguageModelV4Usage,
} from '@ai-sdk/provider'
import type { RuntimeProviderRegistrationV1 } from '@opentiny/tiny-robot-runtime'

export const TERMINAL_DEMO_PROVIDER_ID = 'terminal-demo-provider'
export const TERMINAL_DEMO_MODEL_ID = 'terminal-demo-model'

export type TerminalScenarioId =
  'stop' | 'length' | 'content-filter' | 'provider-error' | 'unexpected-eof' | 'other' | 'abort' | 'tool-calls'

export type TerminalScenarioGroupId = 'finish-reason' | 'failure' | 'continuation'

export interface TerminalScenarioDefinition {
  readonly id: TerminalScenarioId
  readonly group: TerminalScenarioGroupId
  readonly label: string
  readonly description: string
  readonly expected: string
}

export const TERMINAL_SCENARIOS: ReadonlyArray<TerminalScenarioDefinition> = [
  {
    id: 'stop',
    group: 'finish-reason',
    label: '正常完成（stop）',
    description: 'Provider 正常结束文本生成，并报告一组非零 usage。',
    expected: 'Run completed；termination 为 stop。',
  },
  {
    id: 'length',
    group: 'finish-reason',
    label: '达到长度上限（length）',
    description: 'Provider 因输出长度上限结束，但本次 Run 仍然成功完成。',
    expected: 'Run completed；termination 为 max_output_tokens。',
  },
  {
    id: 'content-filter',
    group: 'finish-reason',
    label: '内容过滤（content-filter）',
    description: 'Provider 明确报告内容过滤终止。',
    expected: 'Run completed；termination 为 content_filter。',
  },
  {
    id: 'provider-error',
    group: 'failure',
    label: 'Provider 显式错误',
    description: 'Provider 发出包含动态文本和 HTTP 429 的 error part。',
    expected: 'Run failed；Snapshot 只保留归一化的 rate_limit 错误。',
  },
  {
    id: 'unexpected-eof',
    group: 'failure',
    label: '意外 EOF',
    description: '流已经开始，但没有 finish 就提前关闭。',
    expected: 'Run interrupted；不会伪装成成功或 Provider 显式失败。',
  },
  {
    id: 'other',
    group: 'finish-reason',
    label: '未知终止原因（other）',
    description: 'Provider 给出 Runtime 无法安全解释为成功的终止原因。',
    expected: 'Run interrupted；不保留 Provider 的 raw finish reason。',
  },
  {
    id: 'abort',
    group: 'failure',
    label: '用户主动停止',
    description: '本地流保持打开，等待你点击“停止运行”。',
    expected: 'Run aborted；error 为 caller_aborted。',
  },
  {
    id: 'tool-calls',
    group: 'continuation',
    label: '等待工具流程（tool-calls）',
    description: '模型 Step 已结束，但工具执行和后续模型 Step 尚未实现。',
    expected: 'Step completed；Run 保持 active，termination 为 tool_calls。',
  },
]

export const TERMINAL_SCENARIO_GROUPS: ReadonlyArray<{
  readonly id: TerminalScenarioGroupId
  readonly label: string
}> = [
  { id: 'finish-reason', label: 'AI SDK 统一的模型结束原因' },
  { id: 'failure', label: 'Provider、网络与调用方中断' },
  { id: 'continuation', label: '等待后续流程' },
]

const reportedUsage = {
  inputTokens: { total: 12, noCache: 9, cacheRead: 2, cacheWrite: 1 },
  outputTokens: { total: 7, text: 5, reasoning: 2 },
} satisfies LanguageModelV4Usage

function finishPart(
  unified: LanguageModelV4FinishReason['unified'],
  usage: LanguageModelV4Usage = reportedUsage,
): LanguageModelV4StreamPart {
  return {
    type: 'finish',
    finishReason: { unified, raw: 'terminal-demo-raw-finish-canary' },
    usage,
    providerMetadata: { terminalDemo: { secret: 'terminal-demo-metadata-canary' } },
  }
}

function completedTextParts(
  unified: LanguageModelV4FinishReason['unified'],
  usage: LanguageModelV4Usage = reportedUsage,
): ReadonlyArray<LanguageModelV4StreamPart> {
  return [
    {
      type: 'stream-start',
      warnings: [{ type: 'other', message: 'terminal-demo-warning-canary' }],
    },
    { type: 'text-start', id: 'terminal-demo-text' },
    { type: 'text-delta', id: 'terminal-demo-text', delta: '这段内容来自本地 Fake Provider。' },
    { type: 'text-end', id: 'terminal-demo-text' },
    finishPart(unified, usage),
  ]
}

function streamWithDelayedTerminal(
  initialParts: ReadonlyArray<LanguageModelV4StreamPart>,
  terminalPart: LanguageModelV4StreamPart | undefined,
  delayMs: number,
): ReadableStream<LanguageModelV4StreamPart> {
  let timer: ReturnType<typeof setTimeout> | undefined
  return new ReadableStream({
    start(controller) {
      for (const part of initialParts) controller.enqueue(part)
      const finish = () => {
        if (terminalPart !== undefined) controller.enqueue(terminalPart)
        controller.close()
      }
      if (delayMs === 0) finish()
      else timer = setTimeout(finish, delayMs)
    },
    cancel() {
      if (timer !== undefined) clearTimeout(timer)
    },
  })
}

function completedTextStream(
  unified: LanguageModelV4FinishReason['unified'],
  usage: LanguageModelV4Usage,
  terminalDelayMs: number,
): ReadableStream<LanguageModelV4StreamPart> {
  const parts = completedTextParts(unified, usage)
  return streamWithDelayedTerminal(parts.slice(0, -1), parts.at(-1), terminalDelayMs)
}

function createScenarioStream(
  scenarioId: TerminalScenarioId,
  terminalDelayMs: number,
): ReadableStream<LanguageModelV4StreamPart> {
  switch (scenarioId) {
    case 'stop':
      return completedTextStream('stop', reportedUsage, terminalDelayMs)
    case 'length':
      return completedTextStream('length', reportedUsage, terminalDelayMs)
    case 'content-filter':
      return completedTextStream('content-filter', reportedUsage, terminalDelayMs)
    case 'provider-error':
      return streamWithDelayedTerminal(
        [{ type: 'stream-start', warnings: [] }],
        {
          type: 'error',
          error: {
            statusCode: 429,
            isRetryable: true,
            message: 'terminal-demo-secret-canary',
            stack: 'terminal-demo-secret-canary',
          },
        },
        terminalDelayMs,
      )
    case 'unexpected-eof':
      return streamWithDelayedTerminal([{ type: 'stream-start', warnings: [] }], undefined, terminalDelayMs)
    case 'other':
      return completedTextStream('other', reportedUsage, terminalDelayMs)
    case 'abort':
      return new ReadableStream({
        start(controller) {
          controller.enqueue({ type: 'stream-start', warnings: [] })
          controller.enqueue({ type: 'text-start', id: 'terminal-demo-text' })
          controller.enqueue({ type: 'text-delta', id: 'terminal-demo-text', delta: '流正在等待用户停止…' })
        },
      })
    case 'tool-calls':
      return completedTextStream('tool-calls', reportedUsage, terminalDelayMs)
  }
}

/** Creates the deterministic local Provider used only by the documentation demo. */
export function createTerminalScenarioRegistration(
  scenarioId: TerminalScenarioId,
  options: { readonly terminalDelayMs?: number } = {},
): RuntimeProviderRegistrationV1 {
  const terminalDelayMs = options.terminalDelayMs ?? 0
  const model = {
    specificationVersion: 'v4',
    provider: TERMINAL_DEMO_PROVIDER_ID,
    modelId: TERMINAL_DEMO_MODEL_ID,
    supportedUrls: {},
    doGenerate: async () => {
      throw new Error('The terminal semantics demo only supports streaming')
    },
    doStream: async (_options: LanguageModelV4CallOptions) => ({
      stream: createScenarioStream(scenarioId, terminalDelayMs),
    }),
  } as unknown as LanguageModelV4

  return {
    providerId: TERMINAL_DEMO_PROVIDER_ID,
    models: {
      [TERMINAL_DEMO_MODEL_ID]: { capabilities: { streaming: true, reasoning: false } },
    },
    createProvider: () => ({
      specificationVersion: 'v4',
      languageModel: () => model,
    }),
  }
}
