/**
 * Framework-independent command, provider-registration, and snapshot contracts for
 * Tiny Robot conversations.
 *
 * @packageDocumentation
 */
export type {
  AbortCommand,
  ApproveToolCallCommand,
  ConversationSendInput,
  DenyToolCallCommand,
  RegenerateLastResponseCommand,
  RegenerateLastResponseInput,
  RetryLastRunCommand,
  RetryLastRunInput,
  RuntimeCommand,
  SendCommand,
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
  RuntimeLanguageProviderV4,
  RuntimeModelCapabilitiesV1,
  RuntimeModelDescriptorV1,
  RuntimeProviderRegistrationV1,
  RuntimeProviderErrorV1,
} from './model/types'
export { createRuntime } from './runtime/createRuntime'
export type {
  CreateRuntimeOptions,
  RuntimeInspector,
  RuntimeStreamPartInspection,
  TinyRobotConversation,
  TinyRobotRuntime,
} from './runtime/types'
