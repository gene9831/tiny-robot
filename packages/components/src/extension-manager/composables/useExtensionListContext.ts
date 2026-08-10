import type { InjectionKey } from 'vue'
import { inject, provide } from 'vue'
import type { ExtensionCardMoreMenuAction } from '../index.type'
import type { ExtensionCardRenderAction } from '../internal.type'

interface ExtensionListContext {
  getDefaultPrimaryActions: (id: string) => ExtensionCardRenderAction[]
  getDefaultMoreActions: (id: string) => ExtensionCardMoreMenuAction[]
}

const extensionListContextKey: InjectionKey<ExtensionListContext> = Symbol('ExtensionListContext')

export const provideExtensionListContext = (context: ExtensionListContext) => {
  provide(extensionListContextKey, context)
}

export const useExtensionListContext = () => inject(extensionListContextKey)
