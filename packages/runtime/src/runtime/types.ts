import type {
  ConversationSendInput,
  RegenerateLastResponseInput,
  RetryLastRunInput,
  RuntimeCommand,
} from '../commands/types'
import type { LanguageModelV4StreamPart } from '@ai-sdk/provider'
import type { RuntimeSnapshot } from '../domain/types'
import type { RuntimeProviderRegistrationV1 } from '../model/types'

/** Context for one Provider V4 stream part observed before Ingress Guard projection. */
export interface RuntimeStreamPartInspection {
  /** Runtime-owned Run receiving the part. */
  readonly runId: string
  /** Runtime-owned Model Step receiving the part. */
  readonly stepId: string
  /** Application-defined Provider Registration selected for the Run. */
  readonly providerId: string
  /** Provider model identifier selected for the Run. */
  readonly modelId: string
  /** The exact part emitted by `LanguageModelV4.doStream()`. */
  readonly part: LanguageModelV4StreamPart
}

/** Optional observation hooks that cannot alter Runtime stream processing or state. */
export interface RuntimeInspector {
  /**
   * Observes each Provider V4 stream part before the Ingress Guard handles it.
   *
   * @remarks
   * The Runtime ignores the callback return value and suppresses callback errors.
   * Parts may contain provider metadata or raw values and must be handled as
   * sensitive, ephemeral diagnostic data.
   */
  readonly streamPart?: (
    /** V4 part and Runtime-owned context available at the inspection point. */
    inspection: RuntimeStreamPartInspection,
  ) => void
}

/** Dependencies used when constructing a framework-independent Runtime instance. */
export interface CreateRuntimeOptions {
  /**
   * Resolves the application-owned provider registration available to a new run.
   *
   * @remarks
   * The Runtime invokes this synchronous resolver once when a new run begins.
   * Applications may update their provider configuration between runs without
   * rebuilding the Runtime. Returning `undefined` rejects the new run before a
   * provider or model is created.
   *
   * @param providerId - Application-defined provider integration identifier.
   * @returns The current trusted registration, or `undefined` when unavailable.
   */
  readonly resolveProvider: (providerId: string) => RuntimeProviderRegistrationV1 | undefined

  /** Optional ephemeral inspection hooks for debugging Provider boundary input. */
  readonly inspect?: RuntimeInspector
}

/**
 * Public command and snapshot boundary for the framework-independent Runtime.
 *
 * @remarks
 * A conversation may have at most one active run. Runs owned by different
 * conversations may progress independently and concurrently.
 */
export interface TinyRobotRuntime {
  /**
   * Creates an empty Conversation with a Runtime-owned identifier.
   *
   * @returns A stateless facade that binds Conversation commands to the new identifier.
   */
  createConversation(): TinyRobotConversation

  /**
   * Returns the current immutable Runtime snapshot.
   *
   * @returns The latest normalized snapshot known to this Runtime instance.
   */
  getSnapshot(): RuntimeSnapshot

  /**
   * Registers a listener for subsequent snapshot changes.
   *
   * @param listener - Callback that receives each newly published immutable snapshot.
   * @returns A function that removes this listener.
   */
  subscribe(listener: (snapshot: RuntimeSnapshot) => void): () => void

  /**
   * Validates and routes a Runtime command to its requested behavior.
   *
   * @param command - Command to execute against this Runtime instance.
   * @returns A promise that settles after the command is accepted or rejected.
   * @throws A safe Runtime error when the command is invalid or cannot be accepted.
   */
  dispatch(command: RuntimeCommand): Promise<void>

  /**
   * Requests cancellation of the active run in a conversation.
   *
   * @remarks
   * Caller cancellation takes precedence over a Provider error or exception
   * observed by the same model execution. The resulting Snapshot contains one
   * `aborted` run terminal with a normalized, non-sensitive error.
   *
   * @param conversationId - Runtime conversation identifier whose active run should be aborted.
   * @returns A promise that settles after the abort request is accepted or rejected.
   * @throws A safe Runtime error when the Conversation does not exist or has no active execution.
   */
  abort(conversationId: string): Promise<void>

  /**
   * Starts a new attempt for the latest failed, aborted, or interrupted run.
   *
   * @param input - Conversation containing the eligible run.
   * @returns A promise that settles after the retry request is accepted or rejected.
   */
  retryLastRun(input: RetryLastRunInput): Promise<void>

  /**
   * Creates a new run from the same prior context as the latest selected response.
   *
   * @param input - Conversation containing the eligible turn.
   * @returns A promise that settles after the regenerate request is accepted or rejected.
   */
  regenerateLastResponse(input: RegenerateLastResponseInput): Promise<void>

  /**
   * Grants approval for a Runtime tool call that is awaiting user approval.
   *
   * @param toolCallId - Runtime-owned identifier of the pending tool call.
   * @returns A promise that settles after the approval is accepted or rejected.
   */
  approveToolCall(toolCallId: string): Promise<void>

  /**
   * Denies a Runtime tool call that is awaiting user approval.
   *
   * @param toolCallId - Runtime-owned identifier of the pending tool call.
   * @returns A promise that settles after the denial is accepted or rejected.
   */
  denyToolCall(toolCallId: string): Promise<void>
}

/**
 * Command facade bound to one Runtime-owned Conversation.
 *
 * @remarks
 * The facade stores no messages, runs, or answer state. Consumers read all
 * domain state from the owning {@link TinyRobotRuntime} Snapshot.
 */
export interface TinyRobotConversation {
  /** Runtime-owned identifier bound to commands sent through this facade. */
  readonly id: string

  /**
   * Requests a new user turn and text/reasoning response in this Conversation.
   *
   * @param input - Provider, real model, and user text selected for the new run.
   * @returns A promise that settles after the current run terminates or the request is rejected.
   * @throws A safe Runtime error when command, registration, descriptor, or model validation fails.
   */
  send(input: ConversationSendInput): Promise<void>
}
