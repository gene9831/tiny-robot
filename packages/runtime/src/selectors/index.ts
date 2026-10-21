import type {
  RuntimeConversation,
  RuntimeMessage,
  RuntimePart,
  RuntimeRun,
  RuntimeSnapshot,
  RuntimeStep,
  RuntimeTurn,
} from '../domain/types'

/** A message selected with its parts in presentation and prompt-projection order. */
export interface MessageSelection extends Omit<RuntimeMessage, 'partIds'> {
  /** Parts in presentation and prompt-projection order. */
  readonly parts: ReadonlyArray<RuntimePart>
}

/** A run selected with its ordered execution steps and messages. */
export interface RunSelection extends Omit<RuntimeRun, 'messageIds' | 'stepIds'> {
  /** Model and tool steps in accepted execution order. */
  readonly steps: ReadonlyArray<RuntimeStep>
  /** Messages produced or consumed by this run in domain order. */
  readonly messages: ReadonlyArray<MessageSelection>
}

/** A turn selected with every execution attempt made for the same user intent. */
export interface TurnSelection extends Omit<RuntimeTurn, 'runIds' | 'selectedRunId'> {
  /** Execution attempts in attempt order. */
  readonly runs: ReadonlyArray<RunSelection>
  /**
   * Run currently selected as this turn's answer.
   *
   * @remarks
   * Retry or regenerate can create multiple runs for one turn. When present,
   * this references the chosen object from `runs` rather than a copied run.
   */
  readonly selectedRun?: RunSelection
}

/** A conversation selected as an ordered, directly traversable domain tree. */
export interface ConversationSelection extends Omit<RuntimeConversation, 'activeRunId' | 'turnIds'> {
  /** Turns in conversation order. */
  readonly turns: ReadonlyArray<TurnSelection>
  /** Currently executing run, referencing the same object nested under `turns`. */
  readonly activeRun?: RunSelection
}

/** Stable error code exposed when normalized snapshot relations are corrupt. */
export type RuntimeSelectorErrorCode = 'dangling-reference'

/** Error thrown when an existing entity references a missing normalized entity. */
export class RuntimeSelectorError extends Error {
  /** Machine-readable selector failure category. */
  readonly code: RuntimeSelectorErrorCode = 'dangling-reference'

  /** Identifier of the entity that owns the invalid relationship. */
  readonly sourceId: string

  /** Relationship field containing the missing identifier. */
  readonly relation: string

  /** Referenced identifier that is absent from the snapshot. */
  readonly targetId: string

  /**
   * Creates an error describing one dangling normalized reference.
   *
   * @param sourceId - Entity that owns the relationship.
   * @param relation - Relationship field containing the reference.
   * @param targetId - Referenced entity that is missing.
   */
  constructor(sourceId: string, relation: string, targetId: string) {
    super(`Snapshot entity "${sourceId}" has a dangling ${relation} reference to "${targetId}".`)
    this.name = 'RuntimeSelectorError'
    this.sourceId = sourceId
    this.relation = relation
    this.targetId = targetId
  }
}

interface MessageSelectionCache {
  readonly parts: ReadonlyArray<RuntimePart>
  readonly value: MessageSelection
}

interface RunSelectionCache {
  readonly steps: ReadonlyArray<RuntimeStep>
  readonly messages: ReadonlyArray<MessageSelection>
  readonly value: RunSelection
}

interface TurnSelectionCache {
  readonly runs: ReadonlyArray<RunSelection>
  readonly selectedRun: RunSelection | undefined
  readonly value: TurnSelection
}

interface ConversationSelectionCache {
  readonly turns: ReadonlyArray<TurnSelection>
  readonly activeRun: RunSelection | undefined
  readonly value: ConversationSelection
}

const messageSelectionCache = new WeakMap<RuntimeMessage, MessageSelectionCache>()
const runSelectionCache = new WeakMap<RuntimeRun, RunSelectionCache>()
const turnSelectionCache = new WeakMap<RuntimeTurn, TurnSelectionCache>()
const conversationSelectionCache = new WeakMap<RuntimeConversation, ConversationSelectionCache>()

function requireRelated<T>(
  entitiesById: Readonly<Record<string, T>>,
  targetId: string,
  sourceId: string,
  relation: string,
): T {
  const entity = entitiesById[targetId]

  if (entity === undefined) {
    throw new RuntimeSelectorError(sourceId, relation, targetId)
  }

  return entity
}

function haveSameItems<T>(left: ReadonlyArray<T>, right: ReadonlyArray<T>): boolean {
  return left.length === right.length && left.every((item, index) => item === right[index])
}

function reuseItems<T>(next: ReadonlyArray<T>, previous?: ReadonlyArray<T>): ReadonlyArray<T> {
  return previous !== undefined && haveSameItems(next, previous) ? previous : next
}

function selectMessageRequired(snapshot: RuntimeSnapshot, message: RuntimeMessage): MessageSelection {
  const previous = messageSelectionCache.get(message)
  const parts = reuseItems(
    message.partIds.map((partId) => requireRelated(snapshot.partsById, partId, message.id, 'partIds')),
    previous?.parts,
  )

  if (previous !== undefined && parts === previous.parts) {
    return previous.value
  }

  const value: MessageSelection = {
    id: message.id,
    turnId: message.turnId,
    runId: message.runId,
    role: message.role,
    parts,
  }
  messageSelectionCache.set(message, { parts, value })
  return value
}

function selectRunRequired(snapshot: RuntimeSnapshot, run: RuntimeRun): RunSelection {
  const previous = runSelectionCache.get(run)
  const steps = reuseItems(
    run.stepIds.map((stepId) => requireRelated(snapshot.stepsById, stepId, run.id, 'stepIds')),
    previous?.steps,
  )
  const messages = reuseItems(
    run.messageIds.map((messageId) =>
      selectMessageRequired(snapshot, requireRelated(snapshot.messagesById, messageId, run.id, 'messageIds')),
    ),
    previous?.messages,
  )

  if (previous !== undefined && steps === previous.steps && messages === previous.messages) {
    return previous.value
  }

  const value: RunSelection = {
    id: run.id,
    turnId: run.turnId,
    status: run.status,
    providerId: run.providerId,
    modelId: run.modelId,
    capabilities: run.capabilities,
    termination: run.termination,
    error: run.error,
    usage: run.usage,
    steps,
    messages,
  }
  runSelectionCache.set(run, { steps, messages, value })
  return value
}

function selectTurnRequired(snapshot: RuntimeSnapshot, turn: RuntimeTurn): TurnSelection {
  const previous = turnSelectionCache.get(turn)
  const runs = reuseItems(
    turn.runIds.map((runId) =>
      selectRunRequired(snapshot, requireRelated(snapshot.runsById, runId, turn.id, 'runIds')),
    ),
    previous?.runs,
  )
  const selectedRun =
    turn.selectedRunId === undefined
      ? undefined
      : (runs.find(({ id }) => id === turn.selectedRunId) ??
        selectRunRequired(snapshot, requireRelated(snapshot.runsById, turn.selectedRunId, turn.id, 'selectedRunId')))

  if (previous !== undefined && runs === previous.runs && selectedRun === previous.selectedRun) {
    return previous.value
  }

  const value: TurnSelection = {
    id: turn.id,
    conversationId: turn.conversationId,
    runs,
    selectedRun,
  }
  turnSelectionCache.set(turn, { runs, selectedRun, value })
  return value
}

/**
 * Selects a conversation as an ordered domain tree, or `undefined` when absent.
 *
 * @remarks
 * Unchanged descendant branches preserve reference identity across immutable
 * snapshot updates so framework adapters can use shallow reactive containers.
 *
 * @param snapshot - Runtime snapshot to query.
 * @param conversationId - Conversation identifier to select.
 */
export function selectConversation(
  snapshot: RuntimeSnapshot,
  conversationId: string,
): ConversationSelection | undefined {
  const conversation = snapshot.conversationsById[conversationId]
  if (conversation === undefined) {
    return undefined
  }

  const previous = conversationSelectionCache.get(conversation)
  const turns = reuseItems(
    conversation.turnIds.map((turnId) =>
      selectTurnRequired(snapshot, requireRelated(snapshot.turnsById, turnId, conversation.id, 'turnIds')),
    ),
    previous?.turns,
  )
  const activeRun =
    conversation.activeRunId === undefined
      ? undefined
      : (turns.flatMap(({ runs }) => runs).find(({ id }) => id === conversation.activeRunId) ??
        selectRunRequired(
          snapshot,
          requireRelated(snapshot.runsById, conversation.activeRunId, conversation.id, 'activeRunId'),
        ))

  if (previous !== undefined && turns === previous.turns && activeRun === previous.activeRun) {
    return previous.value
  }

  const value: ConversationSelection = { id: conversation.id, turns, activeRun }
  conversationSelectionCache.set(conversation, { turns, activeRun, value })
  return value
}

/**
 * Selects a turn and all its execution attempts, or `undefined` when absent.
 *
 * @param snapshot - Runtime snapshot to query.
 * @param turnId - Turn identifier to select.
 */
export function selectTurn(snapshot: RuntimeSnapshot, turnId: string): TurnSelection | undefined {
  const turn = snapshot.turnsById[turnId]
  return turn === undefined ? undefined : selectTurnRequired(snapshot, turn)
}

/**
 * Selects a run and its ordered steps and messages, or `undefined` when absent.
 *
 * @param snapshot - Runtime snapshot to query.
 * @param runId - Run identifier to select.
 */
export function selectRun(snapshot: RuntimeSnapshot, runId: string): RunSelection | undefined {
  const run = snapshot.runsById[runId]
  return run === undefined ? undefined : selectRunRequired(snapshot, run)
}

/**
 * Selects a message and its ordered parts, or `undefined` when absent.
 *
 * @param snapshot - Runtime snapshot to query.
 * @param messageId - Message identifier to select.
 */
export function selectMessage(snapshot: RuntimeSnapshot, messageId: string): MessageSelection | undefined {
  const message = snapshot.messagesById[messageId]
  return message === undefined ? undefined : selectMessageRequired(snapshot, message)
}
