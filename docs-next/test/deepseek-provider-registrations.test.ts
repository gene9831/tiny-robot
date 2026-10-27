import type { LanguageModelV4StreamPart } from '@ai-sdk/provider'
import { createRuntime } from '@opentiny/tiny-robot-runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  resolveDeepSeekRegistration,
  type DeepSeekModelId,
  type DeepSeekProviderId,
} from '../src/examples/deepseek-runtime/providerRegistrations'

const prompt = [{ role: 'user', content: [{ type: 'text', text: 'Hello from the Runtime' }] }] as const

function getRegistration(providerId: DeepSeekProviderId, apiKey: string) {
  const registration = resolveDeepSeekRegistration(providerId, () => apiKey)
  if (registration === undefined) {
    throw new Error(`Missing DeepSeek registration: ${providerId}`)
  }
  return registration
}

describe('DeepSeek docs-next Provider registrations', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('projects Responses reasoning while keeping raw chunks internal to the Provider', async () => {
    const deepSeekResponsesStream = [
      'data: {"type":"response.created","response":{"id":"response-1","created_at":1,"model":"deepseek-flash","service_tier":null}}',
      '',
      'data: {"type":"response.output_item.added","output_index":0,"item":{"type":"reasoning","id":"reasoning-item-1","encrypted_content":null}}',
      '',
      'data: {"type":"response.reasoning_text.delta","item_id":"reasoning-item-1","content_index":0,"delta":"Think first."}',
      '',
      'data: {"type":"response.output_item.done","output_index":0,"item":{"type":"reasoning","id":"reasoning-item-1","encrypted_content":null}}',
      '',
      'data: {"type":"response.completed","response":{"incomplete_details":null,"usage":null,"reasoning":null,"service_tier":null}}',
      '',
      '',
    ].join('\n')
    vi.stubGlobal(
      'fetch',
      async () =>
        new Response(deepSeekResponsesStream, {
          status: 200,
          headers: { 'content-type': 'text/event-stream; charset=utf-8' },
        }),
    )
    const registration = getRegistration('deepseek-responses', 'responses-test-key')
    const observedParts: LanguageModelV4StreamPart[] = []
    const runtime = createRuntime({
      resolveProvider: () => registration,
      inspect: {
        streamPart: ({ part }) => observedParts.push(part),
      },
    })

    await runtime.createConversation().send({
      providerId: registration.providerId,
      modelId: 'deepseek-flash',
      content: 'Think, then answer.',
    })

    const snapshot = runtime.getSnapshot()
    const run = Object.values(snapshot.runsById)[0]!
    const assistant = run.outputMessageIds
      .map((messageId) => snapshot.messagesById[messageId]!)
      .find((message) => message.role === 'assistant')!

    expect(assistant.partIds.map((partId) => snapshot.partsById[partId])).toEqual([
      expect.objectContaining({ kind: 'reasoning', content: 'Think first.', status: 'completed' }),
    ])
    expect(observedParts.some((part) => part.type === 'raw')).toBe(false)
  })

  it('resolves each DeepSeek API format as a distinct Runtime Provider', async () => {
    const requestUrls: string[] = []
    vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
      requestUrls.push(input instanceof Request ? input.url : String(input))
      return new Response(JSON.stringify({ error: { message: 'controlled test response' } }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      })
    })
    const runtime = createRuntime({
      resolveProvider: (providerId) => resolveDeepSeekRegistration(providerId, () => 'multi-provider-test-key'),
    })

    await runtime
      .createConversation()
      .send({ providerId: 'deepseek-responses', modelId: 'deepseek-flash', content: 'responses' })
      .catch(() => undefined)
    await runtime
      .createConversation()
      .send({ providerId: 'deepseek-chat-completions', modelId: 'deepseek-flash', content: 'chat completions' })
      .catch(() => undefined)

    expect(requestUrls).toEqual(['https://api.deepseek.com/responses', 'https://api.deepseek.com/chat/completions'])
    expect(Object.values(runtime.getSnapshot().runsById).map((run) => run.providerId)).toEqual([
      'deepseek-responses',
      'deepseek-chat-completions',
    ])
  })

  it.each(
    (
      [
        ['deepseek-responses', 'https://api.deepseek.com/responses'],
        ['deepseek-chat-completions', 'https://api.deepseek.com/chat/completions'],
        ['deepseek-anthropic-messages', 'https://api.deepseek.com/anthropic/v1/messages'],
      ] as const
    ).flatMap(([providerId, expectedUrl]) =>
      (['deepseek-flash', 'deepseek-v4-pro'] as const).map((modelId) => [providerId, expectedUrl, modelId] as const),
    ),
  )('maps %s / %s through its application-owned Provider registration', async (providerId, expectedUrl, modelId) => {
    let requestUrl: string | undefined
    let requestBody: Record<string, unknown> | undefined
    const apiKeyCanary = `docs-next-${providerId}-api-key-canary`
    vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
      requestUrl = input instanceof Request ? input.url : String(input)
      requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>
      return new Response(JSON.stringify({ error: { message: 'controlled test response' } }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      })
    })
    const registration = getRegistration(providerId satisfies DeepSeekProviderId, apiKeyCanary)
    expect(Object.keys(registration.models)).toEqual(['deepseek-flash', 'deepseek-v4-pro'])
    expect(registration.models[modelId satisfies DeepSeekModelId]).toEqual({
      capabilities: { streaming: true, reasoning: true },
    })
    const runtime = createRuntime({ resolveProvider: () => registration })
    const conversation = runtime.createConversation()
    await conversation
      .send({
        providerId: registration.providerId,
        modelId,
        content: prompt[0].content[0].text,
      })
      .catch(() => undefined)

    expect(requestUrl).toBe(expectedUrl)
    expect(JSON.stringify(requestBody)).not.toContain(apiKeyCanary)
    if (providerId === 'deepseek-responses') {
      expect(requestBody).toMatchObject({ model: modelId, stream: true })
      expect(requestBody).not.toHaveProperty('reasoning')
    } else if (providerId === 'deepseek-chat-completions') {
      expect(requestBody).toMatchObject({ model: modelId, stream: true })
      expect(requestBody).not.toHaveProperty('thinking')
    } else {
      expect(requestBody).toMatchObject({ model: modelId, stream: true })
      expect(requestBody).not.toHaveProperty('thinking')
    }
  })

  it('leaves unknown Provider IDs unresolved', () => {
    expect(resolveDeepSeekRegistration('unknown-provider', () => 'test-key')).toBeUndefined()
  })

  it('inspects Anthropic message_start before the Runtime Guard ignores it', async () => {
    const anthropicTextStream = [
      'event: message_start',
      'data: {"type":"message_start","message":{"id":"msg_test","type":"message","role":"assistant","model":"deepseek-flash","content":[],"stop_reason":null,"stop_sequence":null,"usage":{"input_tokens":2,"output_tokens":0}}}',
      '',
      'event: content_block_start',
      'data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}',
      '',
      'event: content_block_delta',
      'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"OK"}}',
      '',
      'event: content_block_stop',
      'data: {"type":"content_block_stop","index":0}',
      '',
      'event: message_delta',
      'data: {"type":"message_delta","delta":{"stop_reason":"end_turn","stop_sequence":null},"usage":{"output_tokens":1}}',
      '',
      'event: message_stop',
      'data: {"type":"message_stop"}',
      '',
      '',
    ].join('\n')
    vi.stubGlobal(
      'fetch',
      async () =>
        new Response(anthropicTextStream, {
          status: 200,
          headers: { 'content-type': 'text/event-stream; charset=utf-8' },
        }),
    )
    const registration = getRegistration('deepseek-anthropic-messages', 'anthropic-test-key')
    const observedParts: LanguageModelV4StreamPart[] = []
    const runtime = createRuntime({
      resolveProvider: () => registration,
      inspect: {
        streamPart: ({ part }) => observedParts.push(part),
      },
    })
    const conversation = runtime.createConversation()

    await conversation.send({
      providerId: registration.providerId,
      modelId: 'deepseek-flash',
      content: 'Reply with OK.',
    })

    const run = Object.values(runtime.getSnapshot().runsById)[0]
    expect(run).toMatchObject({ status: 'completed', termination: 'stop' })
    expect(observedParts).toContainEqual(expect.objectContaining({ type: 'custom', kind: 'anthropic.message_start' }))
    const assistant = run?.outputMessageIds
      .map((messageId) => runtime.getSnapshot().messagesById[messageId])
      .find((message) => message?.role === 'assistant')
    expect(assistant?.partIds.map((partId) => runtime.getSnapshot().partsById[partId]?.content)).toEqual(['OK'])
  })

  it('projects official DeepSeek reasoning_content and text as separate Runtime Parts', async () => {
    const deepSeekStream = [
      'data: {"id":"chatcmpl_test","object":"chat.completion.chunk","created":1,"model":"deepseek-flash","choices":[{"index":0,"delta":{"role":"assistant","reasoning_content":"Think first."},"finish_reason":null}]}',
      '',
      'data: {"id":"chatcmpl_test","object":"chat.completion.chunk","created":1,"model":"deepseek-flash","choices":[{"index":0,"delta":{"content":"Answer."},"finish_reason":null}]}',
      '',
      'data: {"id":"chatcmpl_test","object":"chat.completion.chunk","created":1,"model":"deepseek-flash","choices":[{"index":0,"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":2,"completion_tokens":3,"total_tokens":5}}',
      '',
      'data: [DONE]',
      '',
      '',
    ].join('\n')
    const observedParts: LanguageModelV4StreamPart[] = []
    vi.stubGlobal(
      'fetch',
      async () =>
        new Response(deepSeekStream, {
          status: 200,
          headers: { 'content-type': 'text/event-stream; charset=utf-8' },
        }),
    )
    const registration = getRegistration('deepseek-chat-completions', 'deepseek-test-key')
    const runtime = createRuntime({
      resolveProvider: () => registration,
      inspect: {
        streamPart: ({ part }) => observedParts.push(part),
      },
    })
    const conversation = runtime.createConversation()

    await conversation.send({
      providerId: registration.providerId,
      modelId: 'deepseek-flash',
      content: 'Think, then answer.',
    })

    const snapshot = runtime.getSnapshot()
    const run = Object.values(snapshot.runsById)[0]!
    const assistant = run.outputMessageIds
      .map((messageId) => snapshot.messagesById[messageId]!)
      .find((message) => message.role === 'assistant')!

    expect(assistant.partIds.map((partId) => snapshot.partsById[partId])).toEqual([
      expect.objectContaining({ kind: 'reasoning', content: 'Think first.', status: 'completed' }),
      expect.objectContaining({ kind: 'text', content: 'Answer.', status: 'completed' }),
    ])
    expect(
      observedParts
        .filter((part) => part.type === 'reasoning-delta' || part.type === 'text-delta')
        .map((part) => ({ type: part.type, content: part.delta })),
    ).toEqual([
      { type: 'reasoning-delta', content: 'Think first.' },
      { type: 'text-delta', content: 'Answer.' },
    ])
  })
})
