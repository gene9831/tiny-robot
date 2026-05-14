import type { Ref, InjectionKey } from 'vue'
import { inject, provide } from 'vue'

export type SlotName = 'header' | 'main' | 'footer' | 'sidebar-left' | 'sidebar-right'

export interface ChatContext {
  sidebarLeftOpen: Ref<boolean>
}

const key: InjectionKey<ChatContext> = Symbol('ChatContext')

export function provideChatContext(context: ChatContext) {
  provide(key, context)
}

export function useChatContext() {
  return inject(key, undefined)
}
