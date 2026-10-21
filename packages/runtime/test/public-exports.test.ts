import { describe, expectTypeOf, it } from 'vitest'
import type { ProviderV4 } from '@ai-sdk/provider'
import type {
  ConversationSendInput,
  CreateRuntimeOptions,
  RegenerateLastResponseInput,
  RetryLastRunInput,
  RuntimeCommand,
  RuntimeLanguageProviderV4,
  RuntimeModelCapabilitiesV1,
  RuntimeModelDescriptorV1,
  RuntimeProviderRegistrationV1,
  RuntimeProviderErrorV1,
  RuntimeInspector,
  RuntimeSnapshot,
  RuntimeStreamPartInspection,
  SendCommand,
  TinyRobotConversation,
  TinyRobotRuntime,
} from '../src/index'

type ForbiddenBoundaryKey =
  | 'authorization'
  | 'cookie'
  | 'credential'
  | 'headers'
  | 'providerMetadata'
  | 'providerOptions'
  | 'raw'
  | 'rawChunk'
  | 'rawRequest'
  | 'rawResponse'

type PreviousDepth = [never, 0, 1, 2, 3, 4, 5, 6]

type ExpectedRuntimeModelCapabilityKey = 'streaming' | 'reasoning'
type ExpectedRuntimeProviderRegistrationKey = 'providerId' | 'models' | 'createProvider'
type ExpectedRuntimeModelDescriptorKey = 'capabilities'
type ExpectedSendCommandKey = 'type' | 'conversationId' | 'providerId' | 'modelId' | 'content'
type ExpectedConversationSendInputKey = 'providerId' | 'modelId' | 'content'
type ExpectedRunReuseInputKey = 'conversationId'
type ExpectedTinyRobotConversationKey = 'id' | 'send'
type ExpectedTinyRobotRuntimeKey =
  | 'createConversation'
  | 'getSnapshot'
  | 'subscribe'
  | 'dispatch'
  | 'abort'
  | 'retryLastRun'
  | 'regenerateLastResponse'
  | 'approveToolCall'
  | 'denyToolCall'

type ContainsForbiddenBoundaryKey<T, Depth extends number = 6> = Depth extends 0
  ? false
  : T extends (...args: never[]) => unknown
    ? false
    : T extends readonly (infer Item)[]
      ? ContainsForbiddenBoundaryKey<Item, PreviousDepth[Depth] & number>
      : T extends object
        ? Extract<keyof T, ForbiddenBoundaryKey> extends never
          ? true extends {
              [Key in keyof T]-?: ContainsForbiddenBoundaryKey<T[Key], PreviousDepth[Depth] & number>
            }[keyof T]
            ? true
            : false
          : true
        : false

describe('public Runtime boundary', () => {
  it('exports the approved provider registration and runtime surface', () => {
    expectTypeOf<RuntimeLanguageProviderV4>().toEqualTypeOf<
      Pick<ProviderV4, 'specificationVersion' | 'languageModel'>
    >()
    expectTypeOf<keyof RuntimeProviderRegistrationV1>().toEqualTypeOf<ExpectedRuntimeProviderRegistrationKey>()
    expectTypeOf<keyof RuntimeModelDescriptorV1>().toEqualTypeOf<ExpectedRuntimeModelDescriptorKey>()
    expectTypeOf<RuntimeProviderRegistrationV1['createProvider']>().parameters.toEqualTypeOf<[]>()
    expectTypeOf<CreateRuntimeOptions['resolveProvider']>().returns.toEqualTypeOf<
      RuntimeProviderRegistrationV1 | undefined
    >()
    expectTypeOf<CreateRuntimeOptions['inspect']>().toEqualTypeOf<RuntimeInspector | undefined>()
    expectTypeOf<NonNullable<RuntimeInspector['streamPart']>>()
      .parameter(0)
      .toEqualTypeOf<RuntimeStreamPartInspection>()
    expectTypeOf<RuntimeModelCapabilitiesV1>().toHaveProperty('streaming')
    expectTypeOf<RuntimeModelCapabilitiesV1>().toHaveProperty('reasoning')
    expectTypeOf<RuntimeProviderErrorV1>().toHaveProperty('category')
    expectTypeOf<keyof SendCommand>().toEqualTypeOf<ExpectedSendCommandKey>()
    expectTypeOf<keyof ConversationSendInput>().toEqualTypeOf<ExpectedConversationSendInputKey>()
    expectTypeOf<keyof RetryLastRunInput>().toEqualTypeOf<ExpectedRunReuseInputKey>()
    expectTypeOf<keyof RegenerateLastResponseInput>().toEqualTypeOf<ExpectedRunReuseInputKey>()

    expectTypeOf<keyof TinyRobotRuntime>().toEqualTypeOf<ExpectedTinyRobotRuntimeKey>()
    expectTypeOf<keyof TinyRobotConversation>().toEqualTypeOf<ExpectedTinyRobotConversationKey>()
    expectTypeOf<TinyRobotRuntime['getSnapshot']>().returns.toEqualTypeOf<RuntimeSnapshot>()
    expectTypeOf<TinyRobotRuntime['createConversation']>().returns.toEqualTypeOf<TinyRobotConversation>()
    expectTypeOf<TinyRobotRuntime['dispatch']>().parameters.toEqualTypeOf<[command: RuntimeCommand]>()
    expectTypeOf<TinyRobotConversation['send']>().parameter(0).toEqualTypeOf<ConversationSendInput>()
    expectTypeOf<TinyRobotRuntime['retryLastRun']>().parameter(0).toEqualTypeOf<RetryLastRunInput>()
    expectTypeOf<TinyRobotRuntime['regenerateLastResponse']>().parameter(0).toEqualTypeOf<RegenerateLastResponseInput>()
  })

  it('keeps credentials and provider transport data out of serializable state and commands', () => {
    expectTypeOf<ContainsForbiddenBoundaryKey<RuntimeSnapshot>>().toEqualTypeOf<false>()
    expectTypeOf<ContainsForbiddenBoundaryKey<RuntimeCommand>>().toEqualTypeOf<false>()
    expectTypeOf<ContainsForbiddenBoundaryKey<ConversationSendInput>>().toEqualTypeOf<false>()
  })

  it('exports the complete model-semantic capability surface', () => {
    expectTypeOf<keyof RuntimeModelCapabilitiesV1>().toEqualTypeOf<ExpectedRuntimeModelCapabilityKey>()
  })
})
