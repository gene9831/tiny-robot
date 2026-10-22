import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createExecutionStage,
  createExecutionTimelinePlayer,
  type ExecutionStage,
} from '../src/examples/runtime-terminal-semantics/executionTimeline'

describe('Runtime terminal demo execution timeline', () => {
  afterEach(() => vi.useRealTimers())

  it.each([
    [{ runStatus: 'pending' }, 'run-created'],
    [{ runStatus: 'active', stepStatus: 'active' }, 'model-running'],
    [{ runStatus: 'completed', stepStatus: 'completed', termination: 'stop' }, 'run-completed'],
    [{ runStatus: 'failed', stepStatus: 'failed', errorCode: 'provider_rate_limited' }, 'run-failed'],
    [{ runStatus: 'aborted', stepStatus: 'aborted', errorCode: 'caller_aborted' }, 'run-aborted'],
    [{ runStatus: 'interrupted', stepStatus: 'interrupted' }, 'run-interrupted'],
    [{ runStatus: 'active', stepStatus: 'completed', termination: 'tool_calls' }, 'waiting-for-tool'],
  ] as const)('turns public state into the %s execution stage', (input, expectedKind) => {
    expect(createExecutionStage(input).kind).toBe(expectedKind)
  })

  it('reveals observed stages one at a time with a minimum interval', async () => {
    vi.useFakeTimers()
    const presented: ExecutionStage[] = []
    const player = createExecutionTimelinePlayer({
      intervalMs: 600,
      present: (stage) => presented.push(stage),
    })
    const stages = [
      createExecutionStage({ runStatus: 'pending' }),
      createExecutionStage({ runStatus: 'active', stepStatus: 'active' }),
      createExecutionStage({ runStatus: 'completed', stepStatus: 'completed', termination: 'stop' }),
    ]

    for (const stage of stages) player.enqueue(stage)
    await vi.advanceTimersByTimeAsync(0)
    expect(presented.map(({ kind }) => kind)).toEqual(['run-created'])

    await vi.advanceTimersByTimeAsync(599)
    expect(presented.map(({ kind }) => kind)).toEqual(['run-created'])

    await vi.advanceTimersByTimeAsync(1)
    expect(presented.map(({ kind }) => kind)).toEqual(['run-created', 'model-running'])

    await vi.advanceTimersByTimeAsync(600)
    expect(presented.map(({ kind }) => kind)).toEqual(['run-created', 'model-running', 'run-completed'])
    await player.whenIdle()
  })
})
