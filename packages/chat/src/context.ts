import type { Ref, InjectionKey } from 'vue'
import { computed, inject, provide } from 'vue'

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

export function useChatSidebarContext() {
  const context = useChatContext()

  const sidebarLeftOpen = computed({
    get() {
      return context?.sidebarLeftOpen.value
    },
    set(value: boolean) {
      if (context) {
        context.sidebarLeftOpen.value = value
      }
    },
  })

  return {
    sidebarLeftOpen,
    toggleSidebarLeftOpen() {
      sidebarLeftOpen.value = !sidebarLeftOpen.value
    },
  }
}
