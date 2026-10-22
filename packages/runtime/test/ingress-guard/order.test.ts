import type { LanguageModelV4StreamPart } from '@ai-sdk/provider'
import { describe, expect, it } from 'vitest'
import { consumeModelStepStream, ModelStepIngressError } from '../../src/boundary/ingressGuard'
import type { RuntimeDomainEvent } from '../../src/domain/events'
import { completeUsage, streamFromParts } from '../fixtures/v4/text-stop'

const start = { type: 'stream-start', warnings: [] } satisfies LanguageModelV4StreamPart
const finish = {
  type: 'finish',
  finishReason: { unified: 'stop', raw: undefined },
  usage: completeUsage,
} satisfies LanguageModelV4StreamPart

function createInput(parts: ReadonlyArray<LanguageModelV4StreamPart>, createPartId = () => 'runtime-part-1') {
  const events: RuntimeDomainEvent[] = []
  return {
    events,
    input: {
      runId: 'runtime-run-1',
      stepId: 'runtime-step-1',
      messageId: 'runtime-message-1',
      stream: streamFromParts(parts),
      abortSignal: new AbortController().signal,
      createPartId,
      emit: (event: RuntimeDomainEvent) => events.push(event),
    },
  }
}

const orderViolations: ReadonlyArray<{
  name: string
  code: string
  parts: ReadonlyArray<LanguageModelV4StreamPart>
  createPartId?: () => string
}> = [
  {
    name: 'delta before stream start',
    code: 'model_step_stream_start_missing',
    parts: [{ type: 'text-delta', id: 'secret-provider-id', delta: 'secret-delta' }],
  },
  {
    name: 'delta before text start',
    code: 'model_step_text_id_unknown',
    parts: [start, { type: 'text-delta', id: 'secret-provider-id', delta: 'secret-delta' }],
  },
  {
    name: 'duplicate stream start',
    code: 'model_step_stream_start_duplicate',
    parts: [start, start],
  },
  {
    name: 'duplicate active start',
    code: 'model_step_text_start_duplicate',
    parts: [start, { type: 'text-start', id: 'secret-provider-id' }, { type: 'text-start', id: 'secret-provider-id' }],
  },
  {
    name: 'duplicate provider ID after end',
    code: 'model_step_text_id_duplicate',
    parts: [
      start,
      { type: 'text-start', id: 'secret-provider-id' },
      { type: 'text-end', id: 'secret-provider-id' },
      { type: 'text-start', id: 'secret-provider-id' },
    ],
  },
  {
    name: 'duplicate Runtime Part ID',
    code: 'model_step_runtime_part_id_duplicate',
    parts: [
      start,
      { type: 'text-start', id: 'provider-a' },
      { type: 'text-end', id: 'provider-a' },
      { type: 'text-start', id: 'provider-b' },
    ],
    createPartId: () => 'runtime-part-duplicate',
  },
  {
    name: 'end before start',
    code: 'model_step_text_end_before_start',
    parts: [start, { type: 'text-end', id: 'secret-provider-id' }],
  },
  {
    name: 'duplicate end',
    code: 'model_step_text_end_duplicate',
    parts: [
      start,
      { type: 'text-start', id: 'secret-provider-id' },
      { type: 'text-end', id: 'secret-provider-id' },
      { type: 'text-end', id: 'secret-provider-id' },
    ],
  },
  {
    name: 'delta after end',
    code: 'model_step_text_delta_after_end',
    parts: [
      start,
      { type: 'text-start', id: 'secret-provider-id' },
      { type: 'text-end', id: 'secret-provider-id' },
      { type: 'text-delta', id: 'secret-provider-id', delta: 'secret-delta' },
    ],
  },
  {
    name: 'finish with an open text block',
    code: 'model_step_text_open_at_finish',
    parts: [start, { type: 'text-start', id: 'secret-provider-id' }, finish],
  },
  {
    name: 'reasoning delta before reasoning start',
    code: 'model_step_reasoning_id_unknown',
    parts: [start, { type: 'reasoning-delta', id: 'secret-provider-id', delta: 'secret-delta' }],
  },
  {
    name: 'duplicate active reasoning start',
    code: 'model_step_reasoning_start_duplicate',
    parts: [
      start,
      { type: 'reasoning-start', id: 'secret-provider-id' },
      { type: 'reasoning-start', id: 'secret-provider-id' },
    ],
  },
  {
    name: 'duplicate reasoning provider ID after end',
    code: 'model_step_reasoning_id_duplicate',
    parts: [
      start,
      { type: 'reasoning-start', id: 'secret-provider-id' },
      { type: 'reasoning-end', id: 'secret-provider-id' },
      { type: 'reasoning-start', id: 'secret-provider-id' },
    ],
  },
  {
    name: 'reasoning end before start',
    code: 'model_step_reasoning_end_before_start',
    parts: [start, { type: 'reasoning-end', id: 'secret-provider-id' }],
  },
  {
    name: 'duplicate reasoning end',
    code: 'model_step_reasoning_end_duplicate',
    parts: [
      start,
      { type: 'reasoning-start', id: 'secret-provider-id' },
      { type: 'reasoning-end', id: 'secret-provider-id' },
      { type: 'reasoning-end', id: 'secret-provider-id' },
    ],
  },
  {
    name: 'reasoning delta after end',
    code: 'model_step_reasoning_delta_after_end',
    parts: [
      start,
      { type: 'reasoning-start', id: 'secret-provider-id' },
      { type: 'reasoning-end', id: 'secret-provider-id' },
      { type: 'reasoning-delta', id: 'secret-provider-id', delta: 'secret-delta' },
    ],
  },
  {
    name: 'finish with an open reasoning block',
    code: 'model_step_reasoning_open_at_finish',
    parts: [start, { type: 'reasoning-start', id: 'secret-provider-id' }, finish],
  },
  {
    name: 'duplicate Runtime Part ID across reasoning and text',
    code: 'model_step_runtime_part_id_duplicate',
    parts: [
      start,
      { type: 'reasoning-start', id: 'reasoning-provider-id' },
      { type: 'reasoning-end', id: 'reasoning-provider-id' },
      { type: 'text-start', id: 'text-provider-id' },
    ],
    createPartId: () => 'runtime-part-duplicate',
  },
  {
    name: 'duplicate finish',
    code: 'model_step_finish_duplicate',
    parts: [start, finish, finish],
  },
  {
    name: 'part after finish',
    code: 'model_step_part_after_finish',
    parts: [start, finish, { type: 'raw', rawValue: 'raw-after-finish-canary' }],
  },
  {
    name: 'EOF without finish',
    code: 'model_step_finish_missing',
    parts: [start],
  },
  {
    name: 'conflicting response metadata',
    code: 'model_step_response_metadata_conflict',
    parts: [start, { type: 'response-metadata', id: 'response-a' }, { type: 'response-metadata', id: 'response-b' }],
  },
]

describe('minimal text and reasoning Ingress Guard ordering', () => {
  it.each(orderViolations)(
    'rejects $name with one sanitized interrupted terminal',
    async ({ code, parts, createPartId }) => {
      const { input, events } = createInput(parts, createPartId)

      let caught: unknown
      try {
        await consumeModelStepStream(input)
      } catch (error) {
        caught = error
      }

      expect(caught).toBeInstanceOf(ModelStepIngressError)
      expect(caught).toMatchObject({ name: 'ModelStepIngressError', message: code, code, stack: undefined })
      expect(events.filter((event) => event.type === 'run-terminated')).toEqual([
        {
          type: 'run-terminated',
          runId: 'runtime-run-1',
          stepId: 'runtime-step-1',
          runStatus: 'interrupted',
          stepStatus: 'interrupted',
        },
      ])
      const serialized = JSON.stringify({ caught, events })
      expect(serialized).not.toContain('secret')
      expect(serialized).not.toContain('canary')
      expect(events.at(-1)?.type).toBe('run-terminated')
    },
  )

  it('rejects an empty Runtime Part ID without exposing the Provider ID', async () => {
    const { input, events } = createInput([start, { type: 'text-start', id: 'provider-id-canary' }], () => '')

    await expect(consumeModelStepStream(input)).rejects.toMatchObject({
      code: 'model_step_runtime_part_id_invalid',
      stack: undefined,
    })
    expect(JSON.stringify(events)).not.toContain('provider-id-canary')
    expect(events.at(-1)).toMatchObject({ type: 'run-terminated', runStatus: 'interrupted' })
  })

  it('normalizes stream read failures without exposing the thrown value', async () => {
    const events: RuntimeDomainEvent[] = []
    const stream = new ReadableStream<LanguageModelV4StreamPart>({
      start(controller) {
        controller.enqueue(start)
        controller.error(new Error('stream-error-canary'))
      },
    })

    await expect(
      consumeModelStepStream({
        runId: 'runtime-run-1',
        stepId: 'runtime-step-1',
        messageId: 'runtime-message-1',
        stream,
        abortSignal: new AbortController().signal,
        createPartId: () => 'runtime-part-1',
        emit: (event) => events.push(event),
      }),
    ).rejects.toMatchObject({ code: 'model_step_stream_read_failed', stack: undefined })
    expect(JSON.stringify(events)).not.toContain('stream-error-canary')
    expect(events.at(-1)).toMatchObject({ type: 'run-terminated', runStatus: 'interrupted' })
  })

  it('normalizes streamed Provider errors without exposing the thrown value', async () => {
    const { input, events } = createInput([start, { type: 'error', error: new Error('provider-error-canary') }, finish])

    await expect(consumeModelStepStream(input)).rejects.toMatchObject({
      code: 'model_step_provider_error',
      stack: undefined,
    })
    expect(JSON.stringify(events)).not.toContain('provider-error-canary')
    expect(events.filter((event) => event.type === 'run-terminated')).toEqual([
      {
        type: 'run-terminated',
        runId: 'runtime-run-1',
        stepId: 'runtime-step-1',
        runStatus: 'failed',
        stepStatus: 'failed',
        error: {
          category: 'unknown',
          code: 'provider_error',
          retryable: false,
        },
      },
    ])
  })

  it('rejects a runtime-invalid text delta before it can enter a Domain Event', async () => {
    const invalidDelta = {
      type: 'text-delta',
      id: 'provider-id-canary',
      delta: { secret: 'delta-object-canary' },
    } as unknown as LanguageModelV4StreamPart
    const { input, events } = createInput([start, { type: 'text-start', id: 'provider-id-canary' }, invalidDelta])

    await expect(consumeModelStepStream(input)).rejects.toMatchObject({
      code: 'model_step_text_delta_invalid',
      stack: undefined,
    })
    expect(events.filter((event) => event.type === 'text-part-delta')).toEqual([])
    expect(JSON.stringify(events)).not.toContain('canary')
    expect(events.at(-1)).toMatchObject({ type: 'run-terminated', runStatus: 'interrupted' })
  })

  it('normalizes failure to acquire a locked stream reader', async () => {
    const events: RuntimeDomainEvent[] = []
    const stream = streamFromParts([start, finish])
    const lock = stream.getReader()

    await expect(
      consumeModelStepStream({
        runId: 'runtime-run-1',
        stepId: 'runtime-step-1',
        messageId: 'runtime-message-1',
        stream,
        abortSignal: new AbortController().signal,
        createPartId: () => 'runtime-part-1',
        emit: (event) => events.push(event),
      }),
    ).rejects.toMatchObject({ code: 'model_step_stream_unavailable', stack: undefined })
    lock.releaseLock()

    expect(events).toEqual([
      {
        type: 'run-terminated',
        runId: 'runtime-run-1',
        stepId: 'runtime-step-1',
        runStatus: 'interrupted',
        stepStatus: 'interrupted',
      },
    ])
  })
})
