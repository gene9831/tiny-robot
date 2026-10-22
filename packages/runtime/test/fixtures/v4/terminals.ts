import type { LanguageModelV4FinishReason, LanguageModelV4StreamPart, LanguageModelV4Usage } from '@ai-sdk/provider'
import { streamFromParts } from './text-stop'

export const missingUsage = {
  inputTokens: {
    total: undefined,
    noCache: undefined,
    cacheRead: undefined,
    cacheWrite: undefined,
  },
  outputTokens: {
    total: undefined,
    text: undefined,
    reasoning: undefined,
  },
} satisfies LanguageModelV4Usage

export const zeroUsage = {
  inputTokens: {
    total: 0,
    noCache: 0,
    cacheRead: 0,
    cacheWrite: 0,
  },
  outputTokens: {
    total: 0,
    text: 0,
    reasoning: 0,
  },
} satisfies LanguageModelV4Usage

export function terminalParts(
  unified: LanguageModelV4FinishReason['unified'],
  usage: LanguageModelV4Usage = missingUsage,
): ReadonlyArray<LanguageModelV4StreamPart> {
  return [
    {
      type: 'stream-start',
      warnings: [{ type: 'other', message: 'terminal-warning-canary' }],
    },
    {
      type: 'finish',
      finishReason: { unified, raw: 'terminal-raw-reason-canary' },
      usage,
      providerMetadata: { provider: { secret: 'terminal-metadata-canary' } },
    },
  ]
}

export function terminalStream(
  unified: LanguageModelV4FinishReason['unified'],
  usage: LanguageModelV4Usage = missingUsage,
): ReadableStream<LanguageModelV4StreamPart> {
  return streamFromParts(terminalParts(unified, usage))
}
