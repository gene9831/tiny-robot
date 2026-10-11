import type { LanguageModelV4CallOptions } from '@ai-sdk/provider'
import type { RuntimeSnapshot } from '../domain/types'
import { assertModelCapabilities } from './capabilityPreflight'
import { projectPrompt } from './promptProjection'

type RequiredRuntimeModelCallOptionKey = 'prompt' | 'abortSignal'
type OptionalRuntimeModelCallOptionKey = 'maxOutputTokens' | 'reasoning'

/** The approved V4 call options emitted by the Runtime boundary. */
export type RuntimeModelCallOptions = Readonly<
  Required<Pick<LanguageModelV4CallOptions, RequiredRuntimeModelCallOptionKey>> &
    Pick<LanguageModelV4CallOptions, OptionalRuntimeModelCallOptionKey>
>

type ModelCallProjectionOptionInputKey = Exclude<keyof RuntimeModelCallOptions, 'prompt'>

/** Inputs that may affect a text or reasoning model call. */
export type ModelCallProjectionInput = Readonly<
  {
    snapshot: RuntimeSnapshot
    runId: string
  } & Pick<RuntimeModelCallOptions, ModelCallProjectionOptionInputKey>
>

/** Builds the complete allowlisted V4 options for a text or reasoning model call. */
export function buildModelCallOptions(input: ModelCallProjectionInput): RuntimeModelCallOptions {
  const prompt = projectPrompt(input.snapshot, input.runId)
  const run = input.snapshot.runsById[input.runId]!

  assertModelCapabilities(input, run.capabilities)

  const options = {
    prompt,
    ...(input.maxOutputTokens === undefined ? {} : { maxOutputTokens: input.maxOutputTokens }),
    ...(input.reasoning === undefined ? {} : { reasoning: input.reasoning }),
    abortSignal: input.abortSignal,
  } satisfies RuntimeModelCallOptions

  return options
}
