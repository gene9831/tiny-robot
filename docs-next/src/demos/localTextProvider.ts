import type {
  LanguageModelV4,
  LanguageModelV4CallOptions,
  LanguageModelV4StreamPart,
  LanguageModelV4Usage,
} from '@ai-sdk/provider'
import type { RuntimeProviderRegistrationV1 } from '@opentiny/tiny-robot-runtime'

export interface LocalTextRegistrationOptions {
  readonly providerId: string
  readonly modelId: string
  readonly responseText: string
  readonly terminalDelayMs?: number
  readonly onCallOptions?: (options: LanguageModelV4CallOptions) => void
}

const localUsage = {
  inputTokens: { total: 8, noCache: 8, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 6, text: 6, reasoning: 0 },
} satisfies LanguageModelV4Usage

function createLocalTextStream(
  responseText: string,
  terminalDelayMs: number,
): ReadableStream<LanguageModelV4StreamPart> {
  let timer: ReturnType<typeof setTimeout> | undefined

  return new ReadableStream({
    start(controller) {
      controller.enqueue({ type: 'stream-start', warnings: [] })
      controller.enqueue({ type: 'text-start', id: 'local-text' })
      controller.enqueue({ type: 'text-delta', id: 'local-text', delta: responseText })
      controller.enqueue({ type: 'text-end', id: 'local-text' })

      const finish = () => {
        controller.enqueue({
          type: 'finish',
          finishReason: { unified: 'stop', raw: 'stop' },
          usage: localUsage,
        })
        controller.close()
      }

      if (terminalDelayMs === 0) finish()
      else timer = setTimeout(finish, terminalDelayMs)
    },
    cancel() {
      if (timer !== undefined) clearTimeout(timer)
    },
  })
}

/** Creates a deterministic, network-free Provider registration for documentation demos. */
export function createLocalTextRegistration(options: LocalTextRegistrationOptions): RuntimeProviderRegistrationV1 {
  const terminalDelayMs = options.terminalDelayMs ?? 0
  const model = {
    specificationVersion: 'v4',
    provider: options.providerId,
    modelId: options.modelId,
    supportedUrls: {},
    doGenerate: async () => {
      throw new Error('Local documentation demos only support streaming')
    },
    doStream: async (callOptions: LanguageModelV4CallOptions) => {
      options.onCallOptions?.(callOptions)
      return { stream: createLocalTextStream(options.responseText, terminalDelayMs) }
    },
  } satisfies LanguageModelV4

  return {
    providerId: options.providerId,
    models: {
      [options.modelId]: { capabilities: { streaming: true, reasoning: false } },
    },
    createProvider: () => ({
      specificationVersion: 'v4',
      languageModel: () => model,
    }),
  }
}
