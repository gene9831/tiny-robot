import type { LanguageModelV4 } from '@ai-sdk/provider'

/** Run-local inputs used to create a provider model. */
export interface RuntimeModelContextV1 {
  /**
   * Provider credential for the current run.
   *
   * @remarks
   * The Runtime must treat this value as opaque. It must not copy, inspect, log,
   * persist, serialize, or expose the credential through commands, events,
   * snapshots, diagnostics, fixtures, or UI-facing APIs.
   */
  readonly credential?: unknown
}

/** Describes an intentional loss of information in a provider mapping. */
export interface RuntimeMappingLossV1 {
  /** Stable, non-sensitive identifier used to recognize this loss. */
  readonly code: string
  /** Provider capability or input feature affected by the loss. */
  readonly feature: string
  /** Consumer-visible effect of accepting the lossy mapping. */
  readonly consequence: string
}

/**
 * Declares the provider behavior that the Runtime may rely on before a run.
 *
 * @remarks
 * Capabilities describe the reviewed Runtime subset, not every feature offered
 * by the upstream provider. Unsupported or unknown required capabilities must
 * be rejected before model creation.
 */
export interface RuntimeModelCapabilitiesV1 {
  /** Whether direct credentialed requests from a supported browser are verified. */
  readonly browserDirect: 'verified' | 'unsupported' | 'unknown'
  /** Whether streaming is native, emulated, or unavailable for this mapping. */
  readonly streaming: 'native' | 'emulated' | 'unsupported'
  /** Whether client-executed function tools are native, emulated, or unavailable. */
  readonly functionTools: 'native' | 'emulated' | 'unsupported'
  /** Whether more than one tool call may be active in the same model step. */
  readonly parallelToolCalls: 'supported' | 'unsupported' | 'unknown'
  /** Tool-choice modes accepted without provider-specific options. */
  readonly toolChoice: ReadonlyArray<'auto' | 'none' | 'required' | 'named'>
  /** Whether the Runtime may request reasoning within the approved subset. */
  readonly reasoningRequest: 'supported' | 'unsupported' | 'unknown'
  /** Form of reasoning content that may be exposed to consumers. */
  readonly visibleReasoning: 'summary' | 'none'
  /** Whether opaque continuation data may be retained only for the active run. */
  readonly opaqueContinuation: 'run-local' | 'none'
  /** Completeness of normalized usage information supplied by the mapping. */
  readonly usage: 'complete' | 'partial' | 'unavailable'
  /** Reviewed mapping losses that callers must accept before model creation. */
  readonly knownLosses: ReadonlyArray<RuntimeMappingLossV1>
}

/** Registers one provider/model mapping with the Runtime. */
export interface RuntimeModelRegistrationV1 {
  /** Stable, non-sensitive identifier selected by {@link SendInput.registrationId}. */
  readonly id: string
  /**
   * Creates the model instance owned by the current run.
   *
   * @remarks
   * The Runtime calls `doStream()` with an allowlisted
   * `LanguageModelV4CallOptions` request. Only
   * `LanguageModelV4StreamResult.stream` may cross into the Ingress Guard;
   * request and response debugging data from the result must be discarded at
   * the coordinator boundary.
   *
   * @param context - Opaque run-local inputs required by the provider factory.
   * @returns A LanguageModelV4 instance that must not be retained after its run ends.
   */
  readonly createModel: (context: RuntimeModelContextV1) => LanguageModelV4
  /** Reviewed capabilities frozen into each run created from this registration. */
  readonly capabilities: RuntimeModelCapabilitiesV1
}

/** Safe, provider-neutral error information exposed through Runtime state. */
export interface RuntimeProviderErrorV1 {
  /** Broad failure class used for consumer behavior and recovery decisions. */
  readonly category:
    | 'aborted'
    | 'authentication'
    | 'permission'
    | 'rate_limit'
    | 'invalid_request'
    | 'unavailable'
    | 'timeout'
    | 'transport'
    | 'protocol'
    | 'unknown'
  /** Stable allowlisted code that must not contain upstream error text or secrets. */
  readonly code: string
  /** Whether Runtime policy may offer a retry for this normalized failure. */
  readonly retryable: boolean
  /** Sanitized HTTP status when one is safely available; otherwise omitted. */
  readonly httpStatus?: number
}
