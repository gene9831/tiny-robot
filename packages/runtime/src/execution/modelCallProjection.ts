import type { LanguageModelV4CallOptions } from '@ai-sdk/provider'
import type { RuntimeSnapshot } from '../domain/types'
import { projectPrompt } from './promptProjection'

type RequiredRuntimeModelCallOptionKey = 'prompt' | 'abortSignal'
type OptionalRuntimeModelCallOptionKey = 'maxOutputTokens'

/** The approved V4 call options emitted by the Runtime boundary. */
export type RuntimeModelCallOptions = Readonly<
  Required<Pick<LanguageModelV4CallOptions, RequiredRuntimeModelCallOptionKey>> &
    Pick<LanguageModelV4CallOptions, OptionalRuntimeModelCallOptionKey>
>

type ModelCallProjectionOptionInputKey = Exclude<keyof RuntimeModelCallOptions, 'prompt'>

/** Inputs that may affect a text model call. */
export type ModelCallProjectionInput = Readonly<
  {
    snapshot: RuntimeSnapshot
    runId: string
  } & Pick<RuntimeModelCallOptions, ModelCallProjectionOptionInputKey>
>

/** Builds the complete allowlisted V4 options for a text model call. */
export function buildModelCallOptions(input: ModelCallProjectionInput): RuntimeModelCallOptions {
  const prompt = projectPrompt(input.snapshot, input.runId)
  const options = {
    prompt,
    ...(input.maxOutputTokens === undefined ? {} : { maxOutputTokens: input.maxOutputTokens }),
    abortSignal: input.abortSignal,
  } satisfies RuntimeModelCallOptions

  return options
}
