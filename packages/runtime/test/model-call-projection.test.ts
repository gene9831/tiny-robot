import { describe, expect, expectTypeOf, it } from 'vitest'
import type { RuntimeModelCapabilitiesV1, RuntimeSnapshot } from '../src/index'
import type { ModelCapabilityRequirements } from '../src/execution/capabilityPreflight'
import {
  buildModelCallOptions,
  type ModelCallProjectionInput,
  type RuntimeModelCallOptions,
} from '../src/execution/modelCallProjection'

type ExpectedModelCallProjectionInputKey = 'snapshot' | 'runId' | 'maxOutputTokens' | 'reasoning' | 'abortSignal'
type ExpectedRuntimeModelCallOptionKey = 'prompt' | 'maxOutputTokens' | 'reasoning' | 'abortSignal'
type ExpectedModelCapabilityRequirementKey = 'reasoning'

function snapshot(capabilityOverrides: Partial<RuntimeModelCapabilitiesV1> = {}): RuntimeSnapshot {
  return {
    schemaVersion: 1,
    conversationsById: {
      'conversation-1': { id: 'conversation-1', turnIds: ['turn-1'], activeRunId: 'run-1' },
    },
    turnsById: {
      'turn-1': { id: 'turn-1', conversationId: 'conversation-1', runIds: ['run-1'] },
    },
    runsById: {
      'run-1': {
        id: 'run-1',
        turnId: 'turn-1',
        status: 'active',
        stepIds: [],
        messageIds: ['message-user'],
        providerId: 'provider-1',
        modelId: 'model-1',
        capabilities: {
          streaming: true,
          reasoning: true,
          ...capabilityOverrides,
        },
      },
    },
    stepsById: {},
    messagesById: {
      'message-user': {
        id: 'message-user',
        turnId: 'turn-1',
        runId: 'run-1',
        role: 'user',
        partIds: ['part-user'],
      },
    },
    partsById: {
      'part-user': {
        id: 'part-user',
        messageId: 'message-user',
        kind: 'text',
        content: 'Explain the boundary.',
        status: 'completed',
      },
    },
    toolCallsById: {},
  }
}

describe('model call options projection', () => {
  it('derives capability requirements from the call options that affect model support', () => {
    expectTypeOf<keyof ModelCapabilityRequirements>().toEqualTypeOf<ExpectedModelCapabilityRequirementKey>()
  })

  it('exposes exactly the approved text and reasoning call inputs', () => {
    expectTypeOf<keyof ModelCallProjectionInput>().toEqualTypeOf<ExpectedModelCallProjectionInputKey>()
  })

  it('returns exactly the approved V4 call option fields', () => {
    expectTypeOf<keyof RuntimeModelCallOptions>().toEqualTypeOf<ExpectedRuntimeModelCallOptionKey>()
    expectTypeOf<ReturnType<typeof buildModelCallOptions>>().toEqualTypeOf<RuntimeModelCallOptions>()
  })

  it('builds the exact complete allowlisted options object', () => {
    const runtimeSnapshot = snapshot()
    const controller = new AbortController()

    const options = buildModelCallOptions({
      snapshot: runtimeSnapshot,
      runId: 'run-1',
      maxOutputTokens: 512,
      reasoning: 'low',
      abortSignal: controller.signal,
    })

    expect(options).toEqual({
      prompt: [
        {
          role: 'user',
          content: [{ type: 'text', text: 'Explain the boundary.' }],
        },
      ],
      maxOutputTokens: 512,
      reasoning: 'low',
      abortSignal: controller.signal,
    })
    expect(Object.keys(options).sort()).toEqual(['abortSignal', 'maxOutputTokens', 'prompt', 'reasoning'])
  })

  it('omits optional options instead of injecting provider defaults', () => {
    const controller = new AbortController()

    const options = buildModelCallOptions({
      snapshot: snapshot(),
      runId: 'run-1',
      abortSignal: controller.signal,
    })

    expect(options).toEqual({
      prompt: [
        {
          role: 'user',
          content: [{ type: 'text', text: 'Explain the boundary.' }],
        },
      ],
      abortSignal: controller.signal,
    })
    expect(Object.keys(options).sort()).toEqual(['abortSignal', 'prompt'])
  })

  it('rejects unsupported streaming with a stable code', () => {
    expect(() =>
      buildModelCallOptions({
        snapshot: snapshot({ streaming: false }),
        runId: 'run-1',
        abortSignal: new AbortController().signal,
      }),
    ).toThrow(expect.objectContaining({ code: 'model_streaming_unsupported' }))
  })

  it('rejects a reasoning request when the capability is disabled', () => {
    expect(() =>
      buildModelCallOptions({
        snapshot: snapshot({ reasoning: false }),
        runId: 'run-1',
        reasoning: 'medium',
        abortSignal: new AbortController().signal,
      }),
    ).toThrow(expect.objectContaining({ code: 'model_reasoning_unsupported' }))
  })
})
