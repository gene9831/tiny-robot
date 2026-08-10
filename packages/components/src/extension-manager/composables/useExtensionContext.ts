import { inject } from 'vue'
import { extensionContextKey } from './internalExtensionContext'

export const useExtensionContext = () => {
  const context = inject(extensionContextKey)
  if (!context) throw new Error('useExtensionContext must be used inside ExtensionManagerRoot')
  return context
}
