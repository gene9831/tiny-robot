import { createRuntime, type RuntimeRun } from '@opentiny/tiny-robot-runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createTerminalScenarioRegistration,
  TERMINAL_SCENARIOS,
  type TerminalScenarioId,
} from '../src/examples/runtime-terminal-semantics/terminalScenarios'

function latestRun(runtime: ReturnType<typeof createRuntime>): RuntimeRun {
  const run = Object.values(runtime.getSnapshot().runsById).at(-1)
  if (run === undefined) {
    throw new Error('Expected the scenario to create a Run')
  }
  return run
}

async function runScenario(scenarioId: TerminalScenarioId) {
  const registration = createTerminalScenarioRegistration(scenarioId)
  const runtime = createRuntime({ resolveProvider: () => registration })
  const conversation = runtime.createConversation()

  const result = await conversation
    .send({ providerId: registration.providerId, modelId: 'terminal-demo-model', content: '演示终态语义' })
    .catch((error: unknown) => error)

  return { result, run: latestRun(runtime), snapshot: runtime.getSnapshot() }
}

describe('Runtime terminal semantics demo scenarios', () => {
  afterEach(() => vi.useRealTimers())

  it('offers only scenarios that teach Run and Model Step lifecycle outcomes', () => {
    expect(TERMINAL_SCENARIOS.map(({ id }) => id)).toEqual([
      'stop',
      'length',
      'content-filter',
      'provider-error',
      'unexpected-eof',
      'other',
      'abort',
      'tool-calls',
    ])
  })

  it.each([
    ['stop', 'completed', 'stop'],
    ['length', 'completed', 'max_output_tokens'],
    ['content-filter', 'completed', 'content_filter'],
    ['provider-error', 'failed', undefined],
    ['unexpected-eof', 'interrupted', undefined],
    ['other', 'interrupted', undefined],
    ['tool-calls', 'active', 'tool_calls'],
  ] as const)('projects %s through the real Runtime boundary', async (scenarioId, status, termination) => {
    const { run } = await runScenario(scenarioId)

    expect(run).toMatchObject({
      status,
      ...(termination === undefined ? {} : { termination }),
    })
  })

  it('shows only a normalized Provider error in the public Snapshot', async () => {
    const { run, snapshot } = await runScenario('provider-error')

    expect(run.error).toEqual({
      category: 'rate_limit',
      code: 'provider_rate_limited',
      retryable: true,
      httpStatus: 429,
    })
    expect(JSON.stringify(snapshot)).not.toContain('terminal-demo-secret-canary')
  })

  it('does not retain warning, raw finish, or Provider metadata canaries', async () => {
    const { snapshot } = await runScenario('stop')
    const serialized = JSON.stringify(snapshot)

    expect(serialized).not.toContain('terminal-demo-warning-canary')
    expect(serialized).not.toContain('terminal-demo-raw-finish-canary')
    expect(serialized).not.toContain('terminal-demo-metadata-canary')
  })

  it('lets the user abort the pending local stream', async () => {
    const registration = createTerminalScenarioRegistration('abort')
    const runtime = createRuntime({ resolveProvider: () => registration })
    const conversation = runtime.createConversation()
    const send = conversation.send({
      providerId: registration.providerId,
      modelId: 'terminal-demo-model',
      content: '等待用户停止',
    })
    await Promise.resolve()

    await runtime.abort(conversation.id)
    await expect(send).rejects.toMatchObject({ code: 'model_step_aborted' })

    expect(latestRun(runtime)).toMatchObject({
      status: 'aborted',
      error: { category: 'aborted', code: 'caller_aborted', retryable: true },
    })
  })

  it('keeps the real Run active until the delayed Provider terminal arrives', async () => {
    vi.useFakeTimers()
    const registration = createTerminalScenarioRegistration('stop', { terminalDelayMs: 600 })
    const runtime = createRuntime({ resolveProvider: () => registration })
    const conversation = runtime.createConversation()

    const send = conversation.send({
      providerId: registration.providerId,
      modelId: 'terminal-demo-model',
      content: '观察 active 状态',
    })
    await vi.advanceTimersByTimeAsync(0)

    expect(latestRun(runtime).status).toBe('active')
    await vi.advanceTimersByTimeAsync(599)
    expect(latestRun(runtime).status).toBe('active')

    await vi.advanceTimersByTimeAsync(1)
    await send
    expect(latestRun(runtime).status).toBe('completed')
  })
})
