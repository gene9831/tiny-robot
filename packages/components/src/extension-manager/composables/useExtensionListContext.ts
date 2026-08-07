import type { InjectionKey } from 'vue'
import { inject, provide } from 'vue'
import type { ExtensionCardMoreMenuAction, ExtensionCardPrimaryAction } from '../index.type'

interface ExtensionListContext {
  getDefaultPrimaryActions: (id: string) => ExtensionCardPrimaryAction[]
  getDefaultMoreActions: (id: string) => ExtensionCardMoreMenuAction[]
}

const extensionListContextKey: InjectionKey<ExtensionListContext> = Symbol('ExtensionListContext')

export const provideExtensionListContext = (context: ExtensionListContext) => {
  provide(extensionListContextKey, context)
}

export const useExtensionListContext = () => inject(extensionListContextKey)
