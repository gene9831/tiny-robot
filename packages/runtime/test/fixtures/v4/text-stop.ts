import type { LanguageModelV4StreamPart, LanguageModelV4Usage } from '@ai-sdk/provider'

export const completeUsage = {
  inputTokens: {
    total: 12,
    noCache: 8,
    cacheRead: 3,
    cacheWrite: 1,
  },
  outputTokens: {
    total: 7,
    text: 5,
    reasoning: 2,
  },
  raw: { mustNotCrossBoundary: 'usage-raw-canary' },
} satisfies LanguageModelV4Usage

const responseMetadataWithUnknownField = {
  type: 'response-metadata',
  id: 'response_123',
  modelId: 'vendor/model-1:fast',
  timestamp: new Date('2026-10-12T00:00:00.000Z'),
  ignoredField: 'metadata-canary',
} as LanguageModelV4StreamPart

export const textStopParts = [
  {
    type: 'stream-start',
    warnings: [{ type: 'other', message: 'warning-canary' }],
  },
  responseMetadataWithUnknownField,
  { type: 'text-start', id: 'provider-text-a', providerMetadata: { provider: { secret: 'metadata-canary' } } },
  { type: 'text-delta', id: 'provider-text-a', delta: ' first ' },
  { type: 'text-start', id: 'provider-text-b' },
  { type: 'text-delta', id: 'provider-text-b', delta: 'second\nline' },
  { type: 'text-delta', id: 'provider-text-a', delta: '\nlast' },
  { type: 'text-end', id: 'provider-text-b' },
  { type: 'text-end', id: 'provider-text-a' },
  {
    type: 'finish',
    finishReason: { unified: 'stop', raw: 'provider-stop-canary' },
    usage: completeUsage,
    providerMetadata: { provider: { secret: 'finish-metadata-canary' } },
  },
] satisfies ReadonlyArray<LanguageModelV4StreamPart>

export function streamFromParts(
  parts: ReadonlyArray<LanguageModelV4StreamPart>,
): ReadableStream<LanguageModelV4StreamPart> {
  return new ReadableStream({
    start(controller) {
      for (const part of parts) {
        controller.enqueue(part)
      }
      controller.close()
    },
  })
}
