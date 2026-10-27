import type { LanguageModelV4CallOptions } from '@ai-sdk/provider'
import { createRuntime, type RuntimeRun } from '@opentiny/tiny-robot-runtime'
import { selectConversation } from '@opentiny/tiny-robot-runtime/selectors'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLocalTextRegistration } from '../src/demos/localTextProvider'

function latestRun(runtime: ReturnType<typeof createRuntime>): RuntimeRun {
  const run = Object.values(runtime.getSnapshot().runsById).at(-1)
  if (run === undefined) throw new Error('Expected a local demo Run')
  return run
}

describe('local documentation text Provider', () => {
  afterEach(() => vi.useRealTimers())

  it('completes a real Runtime send with the configured local answer', async () => {
    const registration = createLocalTextRegistration({
      providerId: 'docs-local',
      modelId: 'fixed-answer',
      responseText: '这是本地确定性回答。',
    })
    const runtime = createRuntime({ resolveProvider: () => registration })
    const conversation = runtime.createConversation()

    await conversation.send({
      providerId: 'docs-local',
      modelId: 'fixed-answer',
      content: '这个回答来自哪里？',
    })

    const selected = selectConversation(runtime.getSnapshot(), conversation.id)
    const run = selected?.turns.at(-1)?.selectedRun
    const assistantText = run?.outputMessages
      .find(({ role }) => role === 'assistant')
      ?.parts.filter(({ kind }) => kind === 'text')
      .map(({ content }) => content ?? '')
      .join('')

    expect({ status: run?.status, termination: run?.termination, assistantText }).toEqual({
      status: 'completed',
      termination: 'stop',
      assistantText: '这是本地确定性回答。',
    })
  })

  it('exposes the call options that the Runtime actually sends to the local model', async () => {
    let observed: LanguageModelV4CallOptions | undefined
    const registration = createLocalTextRegistration({
      providerId: 'docs-local',
      modelId: 'observe-prompt',
      responseText: '收到。',
      onCallOptions: (options) => {
        observed = options
      },
    })
    const runtime = createRuntime({ resolveProvider: () => registration })

    await runtime.createConversation().send({
      providerId: 'docs-local',
      modelId: 'observe-prompt',
      content: '保留领域消息顺序',
    })

    expect(observed?.prompt).toEqual([{ role: 'user', content: [{ type: 'text', text: '保留领域消息顺序' }] }])
    expect(observed?.abortSignal).toBeInstanceOf(AbortSignal)
  })

  it('keeps the Run active until the optional terminal delay elapses', async () => {
    vi.useFakeTimers()
    const registration = createLocalTextRegistration({
      providerId: 'docs-local',
      modelId: 'delayed-answer',
      responseText: '稍后完成。',
      terminalDelayMs: 300,
    })
    const runtime = createRuntime({ resolveProvider: () => registration })
    const conversation = runtime.createConversation()

    const send = conversation.send({
      providerId: 'docs-local',
      modelId: 'delayed-answer',
      content: '观察状态变化',
    })
    await vi.advanceTimersByTimeAsync(0)

    expect(latestRun(runtime).status).toBe('active')
    await vi.advanceTimersByTimeAsync(299)
    expect(latestRun(runtime).status).toBe('active')

    await vi.advanceTimersByTimeAsync(1)
    await send
    expect(latestRun(runtime).status).toBe('completed')
  })
})
