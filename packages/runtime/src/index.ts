/**
 * Framework-independent command, model-registration, and snapshot contracts for
 * Tiny Robot conversations.
 *
 * @packageDocumentation
 */
export type {
  AbortCommand,
  ApproveToolCallCommand,
  DenyToolCallCommand,
  RegenerateLastResponseCommand,
  RetryLastRunCommand,
  RuntimeCommand,
  SendCommand,
  SendInput,
} from './commands/types'
export type {
  JsonObject,
  JsonPrimitive,
  JsonValue,
  RuntimeConversation,
  RuntimeMessage,
  RuntimePart,
  RuntimeRun,
  RuntimeRunStatus,
  RuntimeSnapshot,
  RuntimeStep,
  RuntimeStepStatus,
  RuntimeToolCall,
  RuntimeTurn,
} from './domain/types'
export type {
  RuntimeMappingLossV1,
  RuntimeModelCapabilitiesV1,
  RuntimeModelContextV1,
  RuntimeModelRegistrationV1,
  RuntimeProviderErrorV1,
} from './model/types'
export type { TinyRobotRuntime } from './runtime/types'
