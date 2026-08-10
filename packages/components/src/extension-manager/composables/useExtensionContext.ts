import { inject } from 'vue'
import { extensionContextKey } from './internalExtensionContext'
import type { ExtensionContext } from '../index.type'

export function useExtensionContext(): ExtensionContext
export function useExtensionContext(required: false): ExtensionContext | undefined
export function useExtensionContext(required = true) {
  const context = inject(extensionContextKey)
  if (!context && required) throw new Error('useExtensionContext must be used inside ExtensionManagerRoot')
  return context
}
