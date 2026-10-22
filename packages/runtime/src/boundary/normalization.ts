import type { LanguageModelV4ResponseMetadata, LanguageModelV4Usage } from '@ai-sdk/provider'
import type { RuntimeRun } from '../domain/types'
import type { RuntimeProviderErrorV1 } from '../model/types'

const SAFE_METADATA_ID = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/
const MIN_DATE_EPOCH_MILLISECONDS = -8_640_000_000_000_000
const MAX_DATE_EPOCH_MILLISECONDS = 8_640_000_000_000_000

export type NormalizedResponseMetadata = Readonly<{
  id?: string
  modelId?: string
  timestamp?: number
}>

export class ResponseMetadataConflict extends Error {
  constructor() {
    super('model_step_response_metadata_conflict')
    this.name = 'ResponseMetadataConflict'
    this.stack = undefined
  }
}

export type RuntimeTokenUsage = NonNullable<RuntimeRun['usage']>

export type ProviderErrorContext = 'caller-abort' | 'provider-error'

function readOwnProperty(value: unknown, key: string): unknown {
  if ((typeof value !== 'object' && typeof value !== 'function') || value === null) {
    return undefined
  }

  try {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    return descriptor !== undefined && 'value' in descriptor ? descriptor.value : undefined
  } catch {
    return undefined
  }
}

function normalizeHttpStatus(value: unknown): number | undefined {
  return Number.isInteger(value) && (value as number) >= 100 && (value as number) <= 599 ? (value as number) : undefined
}

/** Converts dynamic Provider failures into a fixed, non-sensitive Runtime error vocabulary. */
export function normalizeProviderError(value: unknown, context: ProviderErrorContext): RuntimeProviderErrorV1 {
  if (context === 'caller-abort') {
    return { category: 'aborted', code: 'caller_aborted', retryable: true }
  }

  const httpStatus = normalizeHttpStatus(
    readOwnProperty(value, 'httpStatus') ?? readOwnProperty(value, 'statusCode') ?? readOwnProperty(value, 'status'),
  )
  const declaredRetryable = readOwnProperty(value, 'retryable') ?? readOwnProperty(value, 'isRetryable')
  const retryable =
    typeof declaredRetryable === 'boolean'
      ? declaredRetryable
      : httpStatus === 408 || httpStatus === 429 || (httpStatus !== undefined && httpStatus >= 500)

  let category: RuntimeProviderErrorV1['category'] = 'unknown'
  let code = 'provider_error'
  if (httpStatus === 401) {
    category = 'authentication'
    code = 'provider_authentication_failed'
  } else if (httpStatus === 403) {
    category = 'permission'
    code = 'provider_permission_denied'
  } else if (httpStatus === 408) {
    category = 'timeout'
    code = 'provider_timeout'
  } else if (httpStatus === 429) {
    category = 'rate_limit'
    code = 'provider_rate_limited'
  } else if (httpStatus !== undefined && httpStatus >= 500) {
    category = 'unavailable'
    code = 'provider_unavailable'
  } else if (httpStatus !== undefined && httpStatus >= 400) {
    category = 'invalid_request'
    code = 'provider_invalid_request'
  }

  return {
    category,
    code,
    retryable,
    ...(httpStatus === undefined ? {} : { httpStatus }),
  }
}

function normalizeMetadataId(value: unknown): string | undefined {
  return typeof value === 'string' && SAFE_METADATA_ID.test(value) ? value : undefined
}

function normalizeTimestamp(value: unknown): number | undefined {
  if (!(value instanceof Date)) {
    return undefined
  }

  const timestamp = value.getTime()
  return Number.isInteger(timestamp) &&
    timestamp >= MIN_DATE_EPOCH_MILLISECONDS &&
    timestamp <= MAX_DATE_EPOCH_MILLISECONDS
    ? timestamp
    : undefined
}

function mergeMetadataField<K extends keyof NormalizedResponseMetadata>(
  current: NormalizedResponseMetadata,
  key: K,
  value: NormalizedResponseMetadata[K],
): NormalizedResponseMetadata {
  if (value === undefined) {
    return current
  }

  const existing = current[key]
  if (existing !== undefined && existing !== value) {
    throw new ResponseMetadataConflict()
  }

  return existing === value ? current : { ...current, [key]: value }
}

/** Normalizes allowlisted response metadata for Step-local consistency checks. */
export function normalizeResponseMetadata(
  current: NormalizedResponseMetadata,
  metadata: LanguageModelV4ResponseMetadata,
): NormalizedResponseMetadata {
  let normalized = mergeMetadataField(current, 'id', normalizeMetadataId(metadata.id))
  normalized = mergeMetadataField(normalized, 'modelId', normalizeMetadataId(metadata.modelId))
  return mergeMetadataField(normalized, 'timestamp', normalizeTimestamp(metadata.timestamp))
}

function normalizeTokenCount(value: number | undefined): number | undefined {
  return value !== undefined && Number.isSafeInteger(value) && value >= 0 ? value : undefined
}

/** Projects the approved V4 usage counters without retaining raw usage data. */
export function normalizeUsage(usage: LanguageModelV4Usage): RuntimeTokenUsage | undefined {
  const inputTokens = normalizeTokenCount(usage.inputTokens.total)
  const outputTokens = normalizeTokenCount(usage.outputTokens.total)
  const reasoningTokens = normalizeTokenCount(usage.outputTokens.reasoning)
  const cacheReadTokens = normalizeTokenCount(usage.inputTokens.cacheRead)
  const cacheWriteTokens = normalizeTokenCount(usage.inputTokens.cacheWrite)
  const normalized: RuntimeTokenUsage = {
    ...(inputTokens === undefined ? {} : { inputTokens }),
    ...(outputTokens === undefined ? {} : { outputTokens }),
    ...(reasoningTokens === undefined ? {} : { reasoningTokens }),
    ...(cacheReadTokens === undefined ? {} : { cacheReadTokens }),
    ...(cacheWriteTokens === undefined ? {} : { cacheWriteTokens }),
  }

  return Object.keys(normalized).length === 0 ? undefined : normalized
}
