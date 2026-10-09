import { describe, expectTypeOf, it } from 'vitest'
import type {
  RuntimeCommand,
  RuntimeModelCapabilitiesV1,
  RuntimeModelContextV1,
  RuntimeModelRegistrationV1,
  RuntimeProviderErrorV1,
  RuntimeSnapshot,
  SendInput,
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
  it('exports the approved model registration and runtime surface', () => {
    expectTypeOf<RuntimeModelRegistrationV1>().toHaveProperty('id')
    expectTypeOf<RuntimeModelRegistrationV1>().toHaveProperty('createModel')
    expectTypeOf<RuntimeModelRegistrationV1>().toHaveProperty('capabilities')
    expectTypeOf<RuntimeModelContextV1>().toHaveProperty('credential')
    expectTypeOf<RuntimeModelCapabilitiesV1>().toHaveProperty('knownLosses')
    expectTypeOf<RuntimeProviderErrorV1>().toHaveProperty('category')

    expectTypeOf<TinyRobotRuntime['getSnapshot']>().returns.toEqualTypeOf<RuntimeSnapshot>()
    expectTypeOf<TinyRobotRuntime['dispatch']>().parameter(0).toEqualTypeOf<RuntimeCommand>()
    expectTypeOf<TinyRobotRuntime['send']>().parameter(0).toEqualTypeOf<SendInput>()
  })

  it('keeps credentials and provider transport data out of serializable state and commands', () => {
    expectTypeOf<ContainsForbiddenBoundaryKey<RuntimeSnapshot>>().toEqualTypeOf<false>()
    expectTypeOf<ContainsForbiddenBoundaryKey<RuntimeCommand>>().toEqualTypeOf<false>()
  })
})
