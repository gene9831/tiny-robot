import type { RuntimeDomainEvent } from './events'
import type {
  RuntimeConversation,
  RuntimeMessage,
  RuntimePart,
  RuntimeRun,
  RuntimeRunStatus,
  RuntimeSnapshot,
  RuntimeStep,
  RuntimeTurn,
} from './types'

/** Creates an empty normalized Runtime Snapshot. */
export function createRuntimeSnapshot(): RuntimeSnapshot {
  return {
    schemaVersion: 1,
    conversationsById: {},
    turnsById: {},
    runsById: {},
    stepsById: {},
    messagesById: {},
    partsById: {},
    toolCallsById: {},
  }
}

function isTerminalRunStatus(status: RuntimeRunStatus): boolean {
  return status !== 'pending' && status !== 'active'
}

function requireEntity<T>(entity: T | undefined, name: string, id: string): T {
  if (entity === undefined) {
    throw new Error(`Missing ${name}: ${id}`)
  }

  return entity
}

function requireOwnership(actualOwnerId: string | undefined, expectedOwnerId: string, entityName: string): void {
  if (actualOwnerId !== expectedOwnerId) {
    throw new Error(`${entityName} does not belong to ${expectedOwnerId}`)
  }
}

function requireRunOwnsPart(snapshot: RuntimeSnapshot, runId: string, part: RuntimePart): void {
  const message = requireEntity(snapshot.messagesById[part.messageId], 'message', part.messageId)
  requireOwnership(message.runId, runId, 'part')
}

function eventTargetsTerminalRun(snapshot: RuntimeSnapshot, event: RuntimeDomainEvent): boolean {
  if (!('runId' in event)) {
    return false
  }

  const run = snapshot.runsById[event.runId]
  return run !== undefined && isTerminalRunStatus(run.status)
}

/** Applies one internal Domain Event without mutating the previous Snapshot. */
export function reduceRuntimeEvent(snapshot: RuntimeSnapshot, event: RuntimeDomainEvent): RuntimeSnapshot {
  if (eventTargetsTerminalRun(snapshot, event)) {
    return snapshot
  }

  switch (event.type) {
    case 'conversation-created': {
      if (snapshot.conversationsById[event.conversationId] !== undefined) {
        return snapshot
      }

      const conversation: RuntimeConversation = {
        id: event.conversationId,
        turnIds: [],
      }

      return {
        ...snapshot,
        conversationsById: {
          ...snapshot.conversationsById,
          [conversation.id]: conversation,
        },
      }
    }

    case 'turn-created': {
      if (snapshot.turnsById[event.turnId] !== undefined) {
        return snapshot
      }

      const conversation = requireEntity(
        snapshot.conversationsById[event.conversationId],
        'conversation',
        event.conversationId,
      )
      const turn: RuntimeTurn = {
        id: event.turnId,
        conversationId: event.conversationId,
        runIds: [],
      }

      return {
        ...snapshot,
        conversationsById: {
          ...snapshot.conversationsById,
          [conversation.id]: {
            ...conversation,
            turnIds: [...conversation.turnIds, turn.id],
          },
        },
        turnsById: {
          ...snapshot.turnsById,
          [turn.id]: turn,
        },
      }
    }

    case 'run-created': {
      if (snapshot.runsById[event.runId] !== undefined) {
        return snapshot
      }

      const conversation = requireEntity(
        snapshot.conversationsById[event.conversationId],
        'conversation',
        event.conversationId,
      )
      const turn = requireEntity(snapshot.turnsById[event.turnId], 'turn', event.turnId)
      requireOwnership(turn.conversationId, conversation.id, 'turn')
      const run: RuntimeRun = {
        id: event.runId,
        turnId: event.turnId,
        status: 'pending',
        stepIds: [],
        messageIds: [],
        provider: event.provider,
        modelId: event.modelId,
        capabilities: {
          ...event.capabilities,
          toolChoice: [...event.capabilities.toolChoice],
          knownLosses: event.capabilities.knownLosses.map((loss) => ({ ...loss })),
        },
      }

      return {
        ...snapshot,
        conversationsById: {
          ...snapshot.conversationsById,
          [conversation.id]: { ...conversation, activeRunId: run.id },
        },
        turnsById: {
          ...snapshot.turnsById,
          [turn.id]: { ...turn, runIds: [...turn.runIds, run.id] },
        },
        runsById: {
          ...snapshot.runsById,
          [run.id]: run,
        },
      }
    }

    case 'step-started': {
      if (snapshot.stepsById[event.stepId] !== undefined) {
        return snapshot
      }

      const run = requireEntity(snapshot.runsById[event.runId], 'run', event.runId)
      if (event.index !== run.stepIds.length) {
        throw new Error(`Step index ${event.index} does not match Run order`)
      }
      const step: RuntimeStep = {
        id: event.stepId,
        runId: event.runId,
        index: event.index,
        kind: event.kind,
        status: 'active',
      }

      return {
        ...snapshot,
        runsById: {
          ...snapshot.runsById,
          [run.id]: { ...run, status: 'active', stepIds: [...run.stepIds, step.id] },
        },
        stepsById: {
          ...snapshot.stepsById,
          [step.id]: step,
        },
      }
    }

    case 'message-created': {
      if (snapshot.messagesById[event.messageId] !== undefined) {
        return snapshot
      }

      const run = requireEntity(snapshot.runsById[event.runId], 'run', event.runId)
      requireOwnership(run.turnId, event.turnId, 'run')
      const message: RuntimeMessage = {
        id: event.messageId,
        turnId: event.turnId,
        runId: event.runId,
        role: event.role,
        partIds: [],
      }

      return {
        ...snapshot,
        runsById: {
          ...snapshot.runsById,
          [run.id]: { ...run, messageIds: [...run.messageIds, message.id] },
        },
        messagesById: {
          ...snapshot.messagesById,
          [message.id]: message,
        },
      }
    }

    case 'text-part-started': {
      if (snapshot.partsById[event.partId] !== undefined) {
        return snapshot
      }

      const message = requireEntity(snapshot.messagesById[event.messageId], 'message', event.messageId)
      requireOwnership(message.runId, event.runId, 'message')
      const part: RuntimePart = {
        id: event.partId,
        messageId: event.messageId,
        kind: 'text',
        status: 'streaming',
        content: '',
      }

      return {
        ...snapshot,
        messagesById: {
          ...snapshot.messagesById,
          [message.id]: { ...message, partIds: [...message.partIds, part.id] },
        },
        partsById: {
          ...snapshot.partsById,
          [part.id]: part,
        },
      }
    }

    case 'text-part-delta': {
      const part = requireEntity(snapshot.partsById[event.partId], 'part', event.partId)
      requireRunOwnsPart(snapshot, event.runId, part)
      if (part.kind !== 'text' || part.status === 'completed' || event.delta.length === 0) {
        return snapshot
      }

      return {
        ...snapshot,
        partsById: {
          ...snapshot.partsById,
          [part.id]: { ...part, content: `${part.content ?? ''}${event.delta}` },
        },
      }
    }

    case 'text-part-ended': {
      const part = requireEntity(snapshot.partsById[event.partId], 'part', event.partId)
      requireRunOwnsPart(snapshot, event.runId, part)
      if (part.kind !== 'text' || part.status === 'completed') {
        return snapshot
      }

      return {
        ...snapshot,
        partsById: {
          ...snapshot.partsById,
          [part.id]: { ...part, status: 'completed' },
        },
      }
    }

    case 'run-terminated': {
      const run = requireEntity(snapshot.runsById[event.runId], 'run', event.runId)
      const step = requireEntity(snapshot.stepsById[event.stepId], 'step', event.stepId)
      requireOwnership(step.runId, run.id, 'step')
      const turn = requireEntity(snapshot.turnsById[run.turnId], 'turn', run.turnId)
      const conversation = requireEntity(
        snapshot.conversationsById[turn.conversationId],
        'conversation',
        turn.conversationId,
      )
      const terminalRun: RuntimeRun = {
        ...run,
        status: event.runStatus,
        ...(event.termination === undefined ? {} : { termination: event.termination }),
        ...(event.error === undefined ? {} : { error: { ...event.error } }),
        ...(event.usage === undefined ? {} : { usage: { ...event.usage } }),
      }
      const terminalConversation: RuntimeConversation = {
        id: conversation.id,
        turnIds: conversation.turnIds,
      }

      return {
        ...snapshot,
        conversationsById: {
          ...snapshot.conversationsById,
          [conversation.id]: terminalConversation,
        },
        turnsById:
          event.runStatus === 'completed'
            ? {
                ...snapshot.turnsById,
                [turn.id]: { ...turn, selectedRunId: run.id },
              }
            : snapshot.turnsById,
        runsById: {
          ...snapshot.runsById,
          [run.id]: terminalRun,
        },
        stepsById: {
          ...snapshot.stepsById,
          [step.id]: { ...step, status: event.stepStatus },
        },
      }
    }
  }
}
