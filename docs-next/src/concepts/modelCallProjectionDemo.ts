import type { LanguageModelV4CallOptions } from '@ai-sdk/provider'
import { createRuntime } from '@opentiny/tiny-robot-runtime'
import { createLocalTextRegistration } from '../demos/localTextProvider'

const PROVIDER_ID = 'model-call-projection-local'
const MODEL_ID = 'call-options-observer'

export type ModelCallProjectionDemoResult =
  | {
      readonly ok: true
      readonly question: string
      readonly callOptions: Readonly<Record<string, unknown>>
    }
  | {
      readonly ok: false
      readonly error: {
        readonly code: 'empty-content'
        readonly message: string
      }
    }

export interface ModelCallProjectionDemoOptions {
  readonly terminalDelayMs?: number
}

function makeJsonSafe(options: LanguageModelV4CallOptions): Readonly<Record<string, unknown>> {
  return Object.fromEntries(
    Object.entries(options).map(([key, value]) => [
      key,
      key === 'abortSignal' ? (value === undefined ? 'unavailable' : 'available') : value,
    ]),
  )
}

/** Observes the options received by a local model through the public Runtime execution path. */
export async function runModelCallProjectionDemo(
  content: string,
  options: ModelCallProjectionDemoOptions = {},
): Promise<ModelCallProjectionDemoResult> {
  if (content.trim().length === 0) {
    return {
      ok: false,
      error: { code: 'empty-content', message: '请输入一条用户消息。' },
    }
  }

  let observedCallOptions: Readonly<Record<string, unknown>> | undefined
  const registration = createLocalTextRegistration({
    providerId: PROVIDER_ID,
    modelId: MODEL_ID,
    responseText: '本地模型已经收到投影后的调用对象。',
    terminalDelayMs: options.terminalDelayMs ?? 400,
    onCallOptions: (callOptions) => {
      observedCallOptions = makeJsonSafe(callOptions)
    },
  })
  const runtime = createRuntime({ resolveProvider: () => registration })

  await runtime.createConversation().send({ providerId: PROVIDER_ID, modelId: MODEL_ID, content })

  if (observedCallOptions === undefined) throw new Error('Local model did not receive call options')
  return { ok: true, question: content, callOptions: observedCallOptions }
}
