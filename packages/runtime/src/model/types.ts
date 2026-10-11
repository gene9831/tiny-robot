import type { ProviderV4 } from '@ai-sdk/provider'

/** AI SDK Provider V4 surface consumed by the Runtime language-model boundary. */
export type RuntimeLanguageProviderV4 = Pick<ProviderV4, 'specificationVersion' | 'languageModel'>

/**
 * Declares the model behavior that the Runtime may rely on before a run.
 *
 * @remarks
 * Each flag describes whether one reviewed model can satisfy the corresponding
 * LanguageModelV4 behavior. It does not expose whether the provider implements
 * that behavior natively or through an adapter. Provider registration
 * maintainers own protocol conversion and the supporting conformance evidence.
 */
export interface RuntimeModelCapabilitiesV1 {
  /** Whether the model can satisfy the Runtime's `doStream()` lifecycle. */
  readonly streaming: boolean
  /** Whether the Runtime may include the standard `reasoning` call option. */
  readonly reasoning: boolean
}

/** Reviewed Runtime policy for one real model identifier exposed by a provider registration. */
export interface RuntimeModelDescriptorV1 {
  /** Model-semantic capabilities copied into each run that selects this descriptor. */
  readonly capabilities: RuntimeModelCapabilitiesV1
}

/**
 * Defines one application-owned and trusted provider integration available to new runs.
 *
 * @remarks
 * A provider integration constructs the registration from application-owned
 * connection and authentication settings. A registration may expose several
 * real model identifiers. The application may resolve a different registration
 * for later runs; a run uses the registration returned when that run begins.
 */
export interface RuntimeProviderRegistrationV1 {
  /** Stable, non-sensitive application identifier for this provider integration. */
  readonly providerId: string
  /** Reviewed model descriptors keyed by the real ID passed to `languageModel()`. */
  readonly models: Readonly<Record<string, RuntimeModelDescriptorV1>>
  /**
   * Creates the AI SDK Provider V4 language-model surface owned by the current run.
   *
   * @remarks
   * The registration implementer owns the target endpoint, headers, and
   * authentication behavior and must verify that each exposed mapping works
   * from supported browsers. Runtime callers do not supply these settings.
   * Applications must resolve only trusted registrations.
   *
   * The Runtime selects the requested real model through `languageModel()` and
   * calls `doStream()` with allowlisted options. Only
   * `LanguageModelV4StreamResult.stream` may cross into the Ingress Guard;
   * request and response debugging data must be discarded at the coordinator
   * boundary.
   *
   * @returns The Provider V4 language-model surface retained only for that run.
   */
  readonly createProvider: () => RuntimeLanguageProviderV4
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
