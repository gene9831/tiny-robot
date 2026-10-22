import type { LanguageModelV4StreamPart } from '@ai-sdk/provider'
import { describe, expect, it } from 'vitest'
import { consumeModelStepStream, ModelStepIngressError } from '../../src/boundary/ingressGuard'
import { normalizeProviderError } from '../../src/boundary/normalization'
import type { RuntimeDomainEvent } from '../../src/domain/events'
import { streamFromParts } from '../fixtures/v4/text-stop'
import { missingUsage, terminalParts, terminalStream, zeroUsage } from '../fixtures/v4/terminals'

function createInput(stream: ReadableStream<LanguageModelV4StreamPart>, abortSignal = new AbortController().signal) {
  const events: RuntimeDomainEvent[] = []
  return {
    events,
    input: {
      runId: 'run-1',
      stepId: 'step-1',
      messageId: 'message-1',
      stream,
      abortSignal,
      createPartId: () => 'part-1',
      emit: (event: RuntimeDomainEvent) => events.push(event),
    },
  }
}

describe('Model Step terminal semantics', () => {
  it.each([
    ['stop', 'completed', 'completed', 'stop'],
    ['length', 'completed', 'completed', 'max_output_tokens'],
    ['content-filter', 'completed', 'completed', 'content_filter'],
    ['error', 'failed', 'failed', undefined],
    ['other', 'interrupted', 'interrupted', undefined],
  ] as const)(
    'maps %s without exposing raw finish or warning data',
    async (reason, runStatus, stepStatus, termination) => {
      const { input, events } = createInput(terminalStream(reason))

      const result = await consumeModelStepStream(input).catch((error: unknown) => error)

      expect(events.filter((event) => event.type === 'run-terminated')).toEqual([
        expect.objectContaining({
          type: 'run-terminated',
          runStatus,
          stepStatus,
          ...(termination === undefined ? {} : { termination }),
        }),
      ])
      if (reason === 'error') {
        expect(result).toMatchObject({ code: 'model_step_provider_error' })
      } else {
        expect(result).toMatchObject({ terminal: { runStatus, stepStatus } })
      }
      expect(JSON.stringify({ events, result })).not.toContain('canary')
    },
  )

  it('completes a tool-call Model Step while keeping the Run active', async () => {
    const { input, events } = createInput(terminalStream('tool-calls', zeroUsage))

    const result = await consumeModelStepStream(input)

    expect(result).toEqual({
      terminal: {
        runStatus: 'active',
        stepStatus: 'completed',
        termination: 'tool_calls',
      },
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        reasoningTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
      },
    })
    expect(events).toEqual([
      {
        type: 'model-step-completed',
        runId: 'run-1',
        stepId: 'step-1',
        termination: 'tool_calls',
        usage: result.usage,
      },
    ])
  })

  it('distinguishes unavailable usage from reported zeroes', async () => {
    const missing = createInput(streamFromParts(terminalParts('stop', missingUsage)))
    const zero = createInput(streamFromParts(terminalParts('stop', zeroUsage)))

    const missingResult = await consumeModelStepStream(missing.input)
    const zeroResult = await consumeModelStepStream(zero.input)

    expect(missingResult).not.toHaveProperty('usage')
    expect(missing.events.at(-1)).not.toHaveProperty('usage')
    expect(zeroResult.usage).toEqual({
      inputTokens: 0,
      outputTokens: 0,
      reasoningTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    })
  })

  it('normalizes explicit Provider errors without reading dynamic text or codes', async () => {
    const canary = 'provider-error-canary'
    const providerError = {
      name: canary,
      message: canary,
      code: canary,
      stack: canary,
      cause: canary,
      statusCode: 429,
      isRetryable: true,
    }
    const { input, events } = createInput(
      streamFromParts([
        { type: 'stream-start', warnings: [] },
        { type: 'error', error: providerError },
      ]),
    )

    const caught = await consumeModelStepStream(input).catch((error: unknown) => error)

    expect(caught).toBeInstanceOf(ModelStepIngressError)
    expect(caught).toMatchObject({ code: 'model_step_provider_error', stack: undefined })
    expect(events.at(-1)).toEqual({
      type: 'run-terminated',
      runId: 'run-1',
      stepId: 'step-1',
      runStatus: 'failed',
      stepStatus: 'failed',
      error: {
        category: 'rate_limit',
        code: 'provider_rate_limited',
        retryable: true,
        httpStatus: 429,
      },
    })
    expect(JSON.stringify({ caught, events })).not.toContain(canary)
  })

  it('normalizes hostile thrown values without invoking unsafe getters', () => {
    const value = Object.create(null, {
      message: {
        get: () => {
          throw new Error('getter-canary')
        },
      },
      statusCode: { value: 503, enumerable: true },
      isRetryable: { value: true, enumerable: true },
    })

    expect(normalizeProviderError(value, 'provider-error')).toEqual({
      category: 'unavailable',
      code: 'provider_unavailable',
      retryable: true,
      httpStatus: 503,
    })
  })

  it('accepts an already-sanitized httpStatus field without copying dynamic category or code', () => {
    expect(
      normalizeProviderError(
        {
          category: 'secret-category-canary',
          code: 'secret-code-canary',
          retryable: true,
          httpStatus: 401,
        },
        'provider-error',
      ),
    ).toEqual({
      category: 'authentication',
      code: 'provider_authentication_failed',
      retryable: true,
      httpStatus: 401,
    })
  })
})
