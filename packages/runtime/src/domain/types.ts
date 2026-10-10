import type { RuntimeModelCapabilitiesV1, RuntimeProviderErrorV1 } from '../model/types'

/** JSON scalar value accepted by serializable Runtime domain data. */
export type JsonPrimitive = boolean | number | string | null

/** Recursively serializable JSON value accepted by Runtime domain data. */
export type JsonValue = JsonPrimitive | JsonObject | ReadonlyArray<JsonValue>

/** Immutable string-keyed JSON object accepted by Runtime domain data. */
export type JsonObject = Readonly<{
  /** Serializable value associated with an application-defined key. */
  [key: string]: JsonValue
}>

/**
 * Lifecycle state of a Runtime run.
 *
 * @remarks
 * `pending` and `active` are non-terminal. `completed`, `failed`, `aborted`,
 * `interrupted`, and `superseded` are terminal and must not accept later events.
 */
export type RuntimeRunStatus = 'pending' | 'active' | 'completed' | 'failed' | 'aborted' | 'interrupted' | 'superseded'

/**
 * Lifecycle state of a model or tool step.
 *
 * @remarks
 * `interrupted` represents an incomplete step whose stream or execution cannot
 * be resumed; it must not be reported as successful or as a provider failure.
 */
export type RuntimeStepStatus = 'pending' | 'active' | 'completed' | 'failed' | 'aborted' | 'interrupted'

/** Persistent conversation root containing an ordered sequence of turns. */
export interface RuntimeConversation {
  /** Runtime-owned identifier that is stable within the snapshot history. */
  readonly id: string
  /** Turn identifiers in conversation order. */
  readonly turnIds: ReadonlyArray<string>
  /** Currently active run, omitted when the conversation has no active run. */
  readonly activeRunId?: string
}

/** One user intent together with every execution attempt made for it. */
export interface RuntimeTurn {
  /** Runtime-owned identifier that is stable within the snapshot history. */
  readonly id: string
  /** Conversation that owns this turn. */
  readonly conversationId: string
  /** Run identifiers in attempt order. */
  readonly runIds: ReadonlyArray<string>
  /** Run whose result is currently selected, omitted until a result is selected. */
  readonly selectedRunId?: string
}

/** One complete execution attempt for a turn. */
export interface RuntimeRun {
  /** Runtime-owned identifier that is stable within the snapshot history. */
  readonly id: string
  /** Turn whose intent this run attempts to fulfill. */
  readonly turnId: string
  /** Current lifecycle state of the run. */
  readonly status: RuntimeRunStatus
  /** Model and tool step identifiers in execution order. */
  readonly stepIds: ReadonlyArray<string>
  /** Message identifiers produced or consumed as part of this run. */
  readonly messageIds: ReadonlyArray<string>
  /** Sanitized, non-sensitive provider identifier frozen for this run. */
  readonly provider: string
  /** Sanitized, non-sensitive model identifier frozen for this run. */
  readonly modelId: string
  /** Reviewed capability descriptor frozen when the run is created. */
  readonly capabilities: RuntimeModelCapabilitiesV1
  /** Accepted model termination reason, omitted when no safe reason is available. */
  readonly termination?: 'stop' | 'max_output_tokens' | 'content_filter' | 'tool_calls'
  /** Normalized safe error, present only when the run exposes a provider failure. */
  readonly error?: RuntimeProviderErrorV1
  /** Available normalized token counts; omitted values remain unavailable rather than zero. */
  readonly usage?: Readonly<{
    /** Input tokens reported by the reviewed provider mapping. */
    inputTokens?: number
    /** Output tokens reported by the reviewed provider mapping. */
    outputTokens?: number
    /** Reasoning tokens reported separately from other output tokens. */
    reasoningTokens?: number
    /** Tokens read from a provider cache. */
    cacheReadTokens?: number
    /** Tokens written to a provider cache. */
    cacheWriteTokens?: number
  }>
}

/** One model invocation or one Runtime-managed tool execution within a run. */
export interface RuntimeStep {
  /** Runtime-owned identifier that is stable within the snapshot history. */
  readonly id: string
  /** Run that owns this step. */
  readonly runId: string
  /** Stable ordering position of this step within its run. */
  readonly index: number
  /** Whether this step invokes a model or executes a Runtime-managed tool. */
  readonly kind: 'model' | 'tool'
  /** Current lifecycle state of the step. */
  readonly status: RuntimeStepStatus
}

/** Ordered collection of renderable parts authored by one role. */
export interface RuntimeMessage {
  /** Runtime-owned identifier that is stable within the snapshot history. */
  readonly id: string
  /** Turn that owns this message. */
  readonly turnId: string
  /** Producing run, omitted for messages that exist independently of a run. */
  readonly runId?: string
  /** Domain role used when projecting the message back into a model prompt. */
  readonly role: 'system' | 'user' | 'assistant' | 'tool'
  /** Part identifiers in presentation and prompt-projection order. */
  readonly partIds: ReadonlyArray<string>
}

/** Typed unit of message content stored independently for normalized lookup. */
export interface RuntimePart {
  /** Runtime-owned identifier that is stable within the snapshot history. */
  readonly id: string
  /** Message that owns this part. */
  readonly messageId: string
  /** Safe domain representation of the part's content category. */
  readonly kind: 'text' | 'reasoning' | 'tool-call' | 'error'
  /** Exact accumulated text for text or visible reasoning parts. */
  readonly content?: string
  /** Streaming lifecycle for incrementally assembled text-like parts. */
  readonly status?: 'streaming' | 'completed'
}

/** Runtime-owned record of a client-executed function tool request. */
export interface RuntimeToolCall {
  /** Runtime-owned identifier used for approval and result correlation. */
  readonly id: string
  /** Run that owns this tool call. */
  readonly runId: string
  /** Registered tool name requested by the model. */
  readonly name: string
  /** Validated, serializable tool arguments after stream assembly. */
  readonly input: JsonObject
  /** Current approval and execution state of the tool call. */
  readonly status: 'pending' | 'awaiting-approval' | 'approved' | 'denied' | 'running' | 'completed' | 'failed'
}

/**
 * Immutable normalized read model exposed by the Runtime.
 *
 * @remarks
 * The snapshot contains only serializable domain data. It must not contain
 * credentials, authorization material, provider headers, raw payloads, raw
 * stream chunks, SDK objects, unsanitized errors, arbitrary provider metadata,
 * or opaque continuation data.
 *
 * IDs connect the normalized records without nesting mutable entity copies:
 * `Conversation.turnIds` points to Turns, `Turn.runIds` points to Runs, and a
 * Run points to its ordered Steps and Messages. Messages then point to their
 * ordered Parts.
 *
 * @example A completed single-step text response
 * ```ts
 * const snapshot: RuntimeSnapshot = {
 *   schemaVersion: 1,
 *   conversationsById: {
 *     'conversation-1': {
 *       id: 'conversation-1',
 *       turnIds: ['turn-1'],
 *     },
 *   },
 *   turnsById: {
 *     'turn-1': {
 *       id: 'turn-1',
 *       conversationId: 'conversation-1',
 *       runIds: ['run-1'],
 *       selectedRunId: 'run-1',
 *     },
 *   },
 *   runsById: {
 *     'run-1': {
 *       id: 'run-1',
 *       turnId: 'turn-1',
 *       status: 'completed',
 *       stepIds: ['step-1'],
 *       messageIds: ['message-user', 'message-assistant'],
 *       provider: 'example-provider',
 *       modelId: 'example-model',
 *       capabilities: {
 *         streaming: 'native',
 *         functionTools: 'unsupported',
 *         parallelToolCalls: 'unsupported',
 *         toolChoice: ['none'],
 *         reasoningRequest: 'unsupported',
 *         visibleReasoning: 'none',
 *         opaqueContinuation: 'none',
 *         usage: 'partial',
 *         knownLosses: [],
 *       },
 *       termination: 'stop',
 *       usage: { inputTokens: 12, outputTokens: 8 },
 *     },
 *   },
 *   stepsById: {
 *     'step-1': {
 *       id: 'step-1',
 *       runId: 'run-1',
 *       index: 0,
 *       kind: 'model',
 *       status: 'completed',
 *     },
 *   },
 *   messagesById: {
 *     'message-user': {
 *       id: 'message-user',
 *       turnId: 'turn-1',
 *       role: 'user',
 *       partIds: ['part-user-text'],
 *     },
 *     'message-assistant': {
 *       id: 'message-assistant',
 *       turnId: 'turn-1',
 *       runId: 'run-1',
 *       role: 'assistant',
 *       partIds: ['part-assistant-text'],
 *     },
 *   },
 *   partsById: {
 *     'part-user-text': {
 *       id: 'part-user-text',
 *       messageId: 'message-user',
 *       kind: 'text',
 *       content: 'Hello',
 *       status: 'completed',
 *     },
 *     'part-assistant-text': {
 *       id: 'part-assistant-text',
 *       messageId: 'message-assistant',
 *       kind: 'text',
 *       content: 'Hi!',
 *       status: 'completed',
 *     },
 *   },
 *   toolCallsById: {},
 * }
 * ```
 */
export interface RuntimeSnapshot {
  /** Persisted schema version used to validate and migrate stored snapshots. */
  readonly schemaVersion: 1
  /** Conversations indexed by Runtime conversation identifier. */
  readonly conversationsById: Readonly<Record<string, RuntimeConversation>>
  /** Turns indexed by Runtime turn identifier. */
  readonly turnsById: Readonly<Record<string, RuntimeTurn>>
  /** Runs indexed by Runtime run identifier. */
  readonly runsById: Readonly<Record<string, RuntimeRun>>
  /** Steps indexed by Runtime step identifier. */
  readonly stepsById: Readonly<Record<string, RuntimeStep>>
  /** Messages indexed by Runtime message identifier. */
  readonly messagesById: Readonly<Record<string, RuntimeMessage>>
  /** Parts indexed by Runtime part identifier. */
  readonly partsById: Readonly<Record<string, RuntimePart>>
  /** Tool calls indexed by Runtime tool-call identifier. */
  readonly toolCallsById: Readonly<Record<string, RuntimeToolCall>>
}
