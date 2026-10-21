import type { ConversationSendInput, RuntimeCommand } from '../commands/types'
import type { RuntimeDomainEvent } from '../domain/events'
import { createRuntimeSnapshot, reduceRuntimeEvent } from '../domain/reducer'
import type { RuntimeSnapshot } from '../domain/types'
import { executeTextRun, RuntimeExecutionError, type RuntimeIdKind } from '../execution/runCoordinator'
import type { CreateRuntimeOptions, TinyRobotConversation, TinyRobotRuntime } from './types'

function freezeSnapshot<T>(value: T): T {
  if (typeof value !== 'object' || value === null || Object.isFrozen(value)) {
    return value
  }

  for (const child of Object.values(value)) {
    freezeSnapshot(child)
  }

  return Object.freeze(value)
}

/**
 * Creates an isolated Runtime with application-owned Provider resolution.
 *
 * @param options - Synchronous Provider resolver used once at the start of each new run.
 * @returns A Runtime whose Snapshot is the sole query source for created Conversations and Runs.
 */
export function createRuntime(options: CreateRuntimeOptions): TinyRobotRuntime {
  let snapshot = freezeSnapshot(createRuntimeSnapshot())
  let nextId = 0
  const listeners = new Set<(snapshot: RuntimeSnapshot) => void>()
  const inspectStreamPart = options.inspect?.streamPart

  const createId = (kind: RuntimeIdKind): string => `${kind}-${++nextId}`
  const emit = (event: RuntimeDomainEvent): void => {
    const nextSnapshot = reduceRuntimeEvent(snapshot, event)
    if (nextSnapshot === snapshot) {
      return
    }
    snapshot = freezeSnapshot(nextSnapshot)
    for (const listener of [...listeners]) {
      listener(snapshot)
    }
  }

  const unsupported = async (): Promise<void> => {
    throw new RuntimeExecutionError('runtime_operation_not_implemented')
  }

  const dispatch = async (command: RuntimeCommand): Promise<void> => {
    if (command.type === 'send') {
      await executeTextRun({
        command,
        resolveProvider: options.resolveProvider,
        getSnapshot: () => snapshot,
        emit,
        createId,
        inspectStreamPart,
      })
      return
    }

    await unsupported()
  }

  const createConversation = (): TinyRobotConversation => {
    const id = createId('conversation')
    emit({ type: 'conversation-created', conversationId: id })

    return Object.freeze({
      id,
      send: (input: ConversationSendInput) =>
        dispatch({
          type: 'send',
          conversationId: id,
          providerId: input.providerId,
          modelId: input.modelId,
          content: input.content,
        }),
    })
  }

  return {
    createConversation,
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    dispatch,
    abort: unsupported,
    retryLastRun: unsupported,
    regenerateLastResponse: unsupported,
    approveToolCall: unsupported,
    denyToolCall: unsupported,
  }
}
