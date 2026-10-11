import type { LanguageModelV4Message, LanguageModelV4Prompt } from '@ai-sdk/provider'
import type { RuntimeMessage, RuntimePart, RuntimeRun, RuntimeSnapshot } from '../domain/types'

class PromptProjectionError extends Error {
  readonly code: string

  constructor(code: string) {
    super(code)
    this.name = 'PromptProjectionError'
    this.code = code
  }
}

function requireRun(snapshot: RuntimeSnapshot, runId: string): RuntimeRun {
  const run = snapshot.runsById[runId]
  if (run === undefined) {
    throw new PromptProjectionError('prompt_run_missing')
  }
  return run
}

function requireMessage(snapshot: RuntimeSnapshot, messageId: string): RuntimeMessage {
  const message = snapshot.messagesById[messageId]
  if (message === undefined) {
    throw new PromptProjectionError('prompt_message_missing')
  }
  return message
}

function requirePart(snapshot: RuntimeSnapshot, message: RuntimeMessage, partId: string): RuntimePart {
  const part = snapshot.partsById[partId]
  if (part === undefined || part.messageId !== message.id) {
    throw new PromptProjectionError('prompt_part_missing')
  }
  return part
}

function requireCompletedContent(part: RuntimePart): string {
  if (part.status !== 'completed') {
    throw new PromptProjectionError('prompt_part_incomplete')
  }
  if (part.content === undefined) {
    throw new PromptProjectionError('prompt_part_content_missing')
  }
  return part.content
}

function projectMessage(snapshot: RuntimeSnapshot, message: RuntimeMessage): LanguageModelV4Message {
  if (message.role === 'tool') {
    throw new PromptProjectionError('prompt_role_not_supported')
  }

  const content = message.partIds.map((partId) => {
    const part = requirePart(snapshot, message, partId)

    switch (part.kind) {
      case 'text':
        return { type: 'text' as const, text: requireCompletedContent(part) }
      case 'reasoning':
        if (message.role !== 'assistant') {
          throw new PromptProjectionError('prompt_part_role_invalid')
        }
        return { type: 'reasoning' as const, text: requireCompletedContent(part) }
      case 'tool-call':
      case 'error':
        throw new PromptProjectionError('prompt_part_not_supported')
      default:
        throw new PromptProjectionError('prompt_part_unknown')
    }
  })

  if (message.role === 'system') {
    if (content.some((part) => part.type !== 'text')) {
      throw new PromptProjectionError('prompt_part_role_invalid')
    }
    return { role: 'system', content: content.map((part) => part.text).join('') }
  }

  if (message.role === 'user') {
    return {
      role: 'user',
      content: content.map((part) => {
        if (part.type !== 'text') {
          throw new PromptProjectionError('prompt_part_role_invalid')
        }
        return part
      }),
    }
  }

  return { role: 'assistant', content }
}

/** Projects supported frozen Run history into the pinned V4 prompt subset. */
export function projectPrompt(snapshot: RuntimeSnapshot, runId: string): LanguageModelV4Prompt {
  const run = requireRun(snapshot, runId)
  return run.messageIds.map((messageId) => projectMessage(snapshot, requireMessage(snapshot, messageId)))
}
