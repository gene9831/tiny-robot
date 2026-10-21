import { createAnthropic } from '@ai-sdk/anthropic'
import { createDeepSeek } from '@ai-sdk/deepseek'
import { createOpenAI } from '@ai-sdk/openai'
import type { LanguageModelV4, LanguageModelV4StreamPart } from '@ai-sdk/provider'
import type { RuntimeLanguageProviderV4, RuntimeProviderRegistrationV1 } from '@opentiny/tiny-robot-runtime'

export const DEEPSEEK_MODELS = {
  'deepseek-flash': { capabilities: { streaming: true, reasoning: true } },
  'deepseek-v4-pro': { capabilities: { streaming: true, reasoning: true } },
} as const satisfies RuntimeProviderRegistrationV1['models']

export type DeepSeekModelId = keyof typeof DEEPSEEK_MODELS

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function createDeepSeekResponsesProvider(apiKey: string): RuntimeLanguageProviderV4 {
  const provider = createOpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com',
  })

  return {
    specificationVersion: provider.specificationVersion,
    languageModel(modelId): LanguageModelV4 {
      const model = provider.languageModel(modelId)
      return {
        specificationVersion: model.specificationVersion,
        provider: model.provider,
        modelId: model.modelId,
        supportedUrls: model.supportedUrls,
        doGenerate: (callOptions) => model.doGenerate(callOptions),
        doStream: async (callOptions) => {
          const result = await model.doStream({
            ...callOptions,
            includeRawChunks: true,
          })
          return {
            ...result,
            stream: result.stream.pipeThrough(
              new TransformStream<LanguageModelV4StreamPart, LanguageModelV4StreamPart>({
                transform(part, controller) {
                  if (part.type !== 'raw') {
                    controller.enqueue(part)
                    return
                  }
                  if (!isRecord(part.rawValue)) {
                    return
                  }

                  const rawValue = part.rawValue
                  if (
                    rawValue.type === 'response.reasoning_text.delta' &&
                    typeof rawValue.item_id === 'string' &&
                    typeof rawValue.content_index === 'number' &&
                    typeof rawValue.delta === 'string'
                  ) {
                    controller.enqueue({
                      type: 'reasoning-delta',
                      id: `${rawValue.item_id}:${rawValue.content_index}`,
                      delta: rawValue.delta,
                    })
                  }
                },
              }),
            ),
          }
        },
      }
    },
  }
}

export const DEEPSEEK_PROVIDERS = {
  'deepseek-responses': {
    label: 'OpenAI Responses',
    endpoint: '/responses',
    createProvider: createDeepSeekResponsesProvider,
  },
  'deepseek-chat-completions': {
    label: 'DeepSeek Native Chat Completions',
    endpoint: '/chat/completions',
    createProvider: (apiKey: string) =>
      createDeepSeek({
        apiKey,
        baseURL: 'https://api.deepseek.com',
      }),
  },
  'deepseek-anthropic-messages': {
    label: 'Anthropic Messages',
    endpoint: '/anthropic/v1/messages',
    createProvider: (apiKey: string) =>
      createAnthropic({
        name: 'deepseek.anthropic',
        apiKey,
        baseURL: 'https://api.deepseek.com/anthropic/v1',
      }),
  },
} as const satisfies Record<
  string,
  {
    readonly label: string
    readonly endpoint: string
    readonly createProvider: (apiKey: string) => RuntimeLanguageProviderV4
  }
>

export type DeepSeekProviderId = keyof typeof DEEPSEEK_PROVIDERS

/** Resolves one DeepSeek registration from the demo's keyed Provider configuration. */
export function resolveDeepSeekRegistration(
  providerId: string,
  apiKey: () => string,
): RuntimeProviderRegistrationV1 | undefined {
  if (!Object.hasOwn(DEEPSEEK_PROVIDERS, providerId)) {
    return undefined
  }

  const resolvedProviderId = providerId as DeepSeekProviderId
  const provider = DEEPSEEK_PROVIDERS[resolvedProviderId]
  return {
    providerId: resolvedProviderId,
    models: DEEPSEEK_MODELS,
    createProvider: () => provider.createProvider(apiKey()),
  }
}
