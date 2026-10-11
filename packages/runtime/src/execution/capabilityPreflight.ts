import type { LanguageModelV4CallOptions } from '@ai-sdk/provider'
import type { RuntimeModelCapabilitiesV1 } from '../model/types'

/** Call-option fields that require reviewed model capabilities. */
export type ModelCapabilityRequirements = Readonly<Pick<LanguageModelV4CallOptions, 'reasoning'>>

class ModelCapabilityError extends Error {
  readonly code: string

  constructor(code: string) {
    super(code)
    this.name = 'ModelCapabilityError'
    this.code = code
  }
}

/** Rejects a model call whose reviewed capabilities cannot satisfy its request. */
export function assertModelCapabilities(
  requirements: ModelCapabilityRequirements,
  capabilities: RuntimeModelCapabilitiesV1,
): void {
  if (!capabilities.streaming) {
    throw new ModelCapabilityError('model_streaming_unsupported')
  }

  if (requirements.reasoning !== undefined && !capabilities.reasoning) {
    throw new ModelCapabilityError('model_reasoning_unsupported')
  }
}
