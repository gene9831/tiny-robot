import type { LanguageModelV4ResponseMetadata, LanguageModelV4Usage } from '@ai-sdk/provider'
import type { RuntimeRun } from '../domain/types'

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
