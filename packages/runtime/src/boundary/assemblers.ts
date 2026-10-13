export type TextAssemblyViolationCode =
  | 'model_step_runtime_part_id_duplicate'
  | 'model_step_runtime_part_id_invalid'
  | 'model_step_text_delta_after_end'
  | 'model_step_text_end_before_start'
  | 'model_step_text_end_duplicate'
  | 'model_step_text_id_duplicate'
  | 'model_step_text_id_unknown'
  | 'model_step_text_open_at_finish'
  | 'model_step_text_start_duplicate'

export class TextAssemblyViolation extends Error {
  readonly code: TextAssemblyViolationCode

  constructor(code: TextAssemblyViolationCode) {
    super(code)
    this.name = 'TextAssemblyViolation'
    this.code = code
    this.stack = undefined
  }
}

interface TextAssemblyState {
  readonly runtimePartId: string
  ended: boolean
}

/** Correlates Provider text IDs with Runtime-owned Part IDs for one Model Step. */
export class TextPartAssemblers {
  readonly #partsByProviderId = new Map<string, TextAssemblyState>()
  readonly #runtimePartIds = new Set<string>()

  start(providerId: string, createPartId: () => string): string {
    const existing = this.#partsByProviderId.get(providerId)
    if (existing !== undefined) {
      throw new TextAssemblyViolation(
        existing.ended ? 'model_step_text_id_duplicate' : 'model_step_text_start_duplicate',
      )
    }

    const runtimePartId = createPartId()
    if (runtimePartId.length === 0) {
      throw new TextAssemblyViolation('model_step_runtime_part_id_invalid')
    }
    if (this.#runtimePartIds.has(runtimePartId)) {
      throw new TextAssemblyViolation('model_step_runtime_part_id_duplicate')
    }

    this.#runtimePartIds.add(runtimePartId)
    this.#partsByProviderId.set(providerId, { runtimePartId, ended: false })
    return runtimePartId
  }

  append(providerId: string): string {
    const state = this.#partsByProviderId.get(providerId)
    if (state === undefined) {
      throw new TextAssemblyViolation('model_step_text_id_unknown')
    }
    if (state.ended) {
      throw new TextAssemblyViolation('model_step_text_delta_after_end')
    }
    return state.runtimePartId
  }

  end(providerId: string): string {
    const state = this.#partsByProviderId.get(providerId)
    if (state === undefined) {
      throw new TextAssemblyViolation('model_step_text_end_before_start')
    }
    if (state.ended) {
      throw new TextAssemblyViolation('model_step_text_end_duplicate')
    }

    state.ended = true
    return state.runtimePartId
  }

  assertClosed(): void {
    for (const state of this.#partsByProviderId.values()) {
      if (!state.ended) {
        throw new TextAssemblyViolation('model_step_text_open_at_finish')
      }
    }
  }
}
