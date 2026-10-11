import type { RegenerateLastResponseInput, RetryLastRunInput, RuntimeCommand, SendInput } from '../commands/types'
import type { RuntimeSnapshot } from '../domain/types'
import type { RuntimeProviderRegistrationV1 } from '../model/types'

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
   * Requests a new user turn and response run through convenience input.
   *
   * @param input - Conversation, provider, model, and content for the new run.
   * @returns A promise that settles after the send request is accepted or rejected.
   * @throws A safe Runtime error when capability preflight or command validation fails.
   */
  send(input: SendInput): Promise<void>

  /**
   * Requests cancellation of the active run in a conversation.
   *
   * @param conversationId - Runtime conversation identifier whose active run should be aborted.
   * @returns A promise that settles after the abort request is accepted or rejected.
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
