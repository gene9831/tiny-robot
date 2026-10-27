import { createRuntime, type RuntimeRunStatus } from '@opentiny/tiny-robot-runtime'
import { selectConversation } from '@opentiny/tiny-robot-runtime/selectors'
import { createLocalTextRegistration } from '../demos/localTextProvider'

const PROVIDER_ID = 'quick-start-local'
const MODEL_ID = 'beijing-climate-demo'
const ANSWER = '北京属于温带季风气候，四季分明，夏季炎热多雨，冬季寒冷干燥。'

export type QuickStartDemoResult =
  | {
      readonly ok: true
      readonly question: string
      readonly answer: string
      readonly status: RuntimeRunStatus
      readonly termination?: 'stop' | 'max_output_tokens' | 'content_filter' | 'tool_calls'
    }
  | {
      readonly ok: false
      readonly error: {
        readonly code: 'empty-content'
        readonly message: string
      }
    }

export interface QuickStartDemoOptions {
  readonly terminalDelayMs?: number
}

/** Runs the quick-start flow against a fresh, deterministic local Runtime. */
export async function runQuickStartDemo(
  content: string,
  options: QuickStartDemoOptions = {},
): Promise<QuickStartDemoResult> {
  if (content.trim().length === 0) {
    return {
      ok: false,
      error: { code: 'empty-content', message: '请输入问题后再提交。' },
    }
  }

  const registration = createLocalTextRegistration({
    providerId: PROVIDER_ID,
    modelId: MODEL_ID,
    responseText: ANSWER,
    terminalDelayMs: options.terminalDelayMs ?? 500,
  })
  const runtime = createRuntime({ resolveProvider: () => registration })
  const conversation = runtime.createConversation()

  await conversation.send({ providerId: PROVIDER_ID, modelId: MODEL_ID, content })

  const run = selectConversation(runtime.getSnapshot(), conversation.id)?.turns.at(-1)?.selectedRun
  if (run === undefined) throw new Error('Quick-start Demo did not produce a selected Run')

  const answer = run.outputMessages
    .find(({ role }) => role === 'assistant')
    ?.parts.filter(({ kind }) => kind === 'text')
    .map(({ content: partContent }) => partContent ?? '')
    .join('')

  if (answer === undefined) throw new Error('Quick-start Demo did not produce an assistant answer')

  return {
    ok: true,
    question: content,
    answer,
    status: run.status,
    termination: run.termination,
  }
}
