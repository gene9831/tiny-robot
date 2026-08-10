import type { Extension, ExtensionInput } from './index.type'

export const normalizeExtension = <TConfig = unknown, TMetadata = unknown>(
  input: ExtensionInput<TConfig, TMetadata>,
): Extension<TConfig, TMetadata> => {
  const { installed = false, config, ...rest } = input

  return {
    ...rest,
    installed,
    ...(installed === true && config !== undefined ? { config } : {}),
  }
}

export const normalizeExtensions = <TConfig = unknown, TMetadata = unknown>(
  inputs: ExtensionInput<TConfig, TMetadata>[],
) => inputs.map(normalizeExtension)
