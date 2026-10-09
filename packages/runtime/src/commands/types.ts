/** Serializable command that starts a new turn and run. */
export interface SendCommand {
  /** Discriminator for a send command. */
  readonly type: 'send'
  /** Conversation that receives the new turn. */
  readonly conversationId: string
  /** Identifier of the reviewed model registration used by the run. */
  readonly registrationId: string
  /** User-authored text to append to the conversation. */
  readonly content: string
}

/** Serializable command that requests cancellation of a conversation's active run. */
export interface AbortCommand {
  /** Discriminator for an abort command. */
  readonly type: 'abort'
  /** Conversation whose active run should receive the abort signal. */
  readonly conversationId: string
}

/** Serializable command that retries the latest eligible unsuccessful run. */
export interface RetryLastRunCommand {
  /** Discriminator for a retry command. */
  readonly type: 'retry-last-run'
  /** Conversation containing the failed, aborted, or interrupted run to retry. */
  readonly conversationId: string
}

/** Serializable command that creates another response from the same prior context. */
export interface RegenerateLastResponseCommand {
  /** Discriminator for a regenerate command. */
  readonly type: 'regenerate-last-response'
  /** Conversation whose latest eligible turn should receive a new run. */
  readonly conversationId: string
}

/** Serializable command that grants a pending Runtime tool approval. */
export interface ApproveToolCallCommand {
  /** Discriminator for a tool-approval command. */
  readonly type: 'approve-tool-call'
  /** Runtime-owned identifier of the tool call awaiting approval. */
  readonly toolCallId: string
}

/** Serializable command that rejects a pending Runtime tool approval. */
export interface DenyToolCallCommand {
  /** Discriminator for a tool-denial command. */
  readonly type: 'deny-tool-call'
  /** Runtime-owned identifier of the tool call awaiting approval. */
  readonly toolCallId: string
}

/** Complete set of commands accepted by {@link TinyRobotRuntime.dispatch}. */
export type RuntimeCommand =
  | SendCommand
  | AbortCommand
  | RetryLastRunCommand
  | RegenerateLastResponseCommand
  | ApproveToolCallCommand
  | DenyToolCallCommand

/** Convenience input for {@link TinyRobotRuntime.send}. */
export interface SendInput {
  /** Conversation that receives the new turn. */
  readonly conversationId: string
  /** Identifier of the reviewed model registration used by the run. */
  readonly registrationId: string
  /** User-authored text to append to the conversation. */
  readonly content: string
  /**
   * Provider credential supplied only for the new run.
   *
   * @remarks
   * Unlike {@link SendCommand}, this convenience input is not serializable. The
   * Runtime must remove this value before command dispatch and must not copy,
   * inspect, log, persist, serialize, or expose it through Runtime state.
   */
  readonly credential?: unknown
}
