import type { RuntimeModelCapabilitiesV1, RuntimeProviderErrorV1 } from '../model/types'
import type { RuntimeRun, RuntimeRunStatus, RuntimeStepStatus } from './types'

type RuntimeTerminalRunStatus = Exclude<RuntimeRunStatus, 'pending' | 'active'>
type RuntimeTerminalStepStatus = Exclude<RuntimeStepStatus, 'pending' | 'active'>
type RuntimeTokenUsage = NonNullable<RuntimeRun['usage']>

interface ConversationCreatedEvent {
  readonly type: 'conversation-created'
  readonly conversationId: string
}

interface TurnCreatedEvent {
  readonly type: 'turn-created'
  readonly conversationId: string
  readonly turnId: string
}

interface RunCreatedEvent {
  readonly type: 'run-created'
  readonly conversationId: string
  readonly turnId: string
  readonly runId: string
  readonly provider: string
  readonly modelId: string
  readonly capabilities: RuntimeModelCapabilitiesV1
}

interface StepStartedEvent {
  readonly type: 'step-started'
  readonly runId: string
  readonly stepId: string
  readonly index: number
  readonly kind: 'model' | 'tool'
}

interface MessageCreatedEvent {
  readonly type: 'message-created'
  readonly runId: string
  readonly turnId: string
  readonly messageId: string
  readonly role: 'system' | 'user' | 'assistant' | 'tool'
}

interface TextPartStartedEvent {
  readonly type: 'text-part-started'
  readonly runId: string
  readonly messageId: string
  readonly partId: string
}

interface TextPartDeltaEvent {
  readonly type: 'text-part-delta'
  readonly runId: string
  readonly partId: string
  readonly delta: string
}

interface TextPartEndedEvent {
  readonly type: 'text-part-ended'
  readonly runId: string
  readonly partId: string
}

interface RunTerminatedEvent {
  readonly type: 'run-terminated'
  readonly runId: string
  readonly stepId: string
  readonly runStatus: RuntimeTerminalRunStatus
  readonly stepStatus: RuntimeTerminalStepStatus
  readonly termination?: 'stop' | 'max_output_tokens' | 'content_filter'
  readonly error?: RuntimeProviderErrorV1
  readonly usage?: RuntimeTokenUsage
}

/** Internal facts accepted by the Runtime reducer. */
export type RuntimeDomainEvent =
  | ConversationCreatedEvent
  | TurnCreatedEvent
  | RunCreatedEvent
  | StepStartedEvent
  | MessageCreatedEvent
  | TextPartStartedEvent
  | TextPartDeltaEvent
  | TextPartEndedEvent
  | RunTerminatedEvent
