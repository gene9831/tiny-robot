import type { RuntimeCommand, SendInput } from '../commands/types'
import type { RuntimeSnapshot } from '../domain/types'

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
   * Validates and applies a serializable Runtime command.
   *
   * @param command - Command to execute against this Runtime instance.
   * @returns A promise that settles after the command is accepted or rejected.
   * @throws A safe Runtime error when the command is invalid or cannot be accepted.
   */
  dispatch(command: RuntimeCommand): Promise<void>

  /**
   * Starts a turn using convenience input that may carry a run-local credential.
   *
   * @param input - Conversation, registration, content, and optional transient credential.
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
   * @param conversationId - Runtime conversation identifier containing the eligible run.
   * @returns A promise that settles after the retry request is accepted or rejected.
   */
  retryLastRun(conversationId: string): Promise<void>

  /**
   * Creates a new run from the same prior context as the latest selected response.
   *
   * @param conversationId - Runtime conversation identifier containing the eligible turn.
   * @returns A promise that settles after the regenerate request is accepted or rejected.
   */
  regenerateLastResponse(conversationId: string): Promise<void>

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
