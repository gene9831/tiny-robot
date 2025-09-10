import { TransitionProps } from 'vue'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TriggerEvents = Partial<Record<`on${Capitalize<string>}`, (...args: any[]) => void>>

export interface BasePopperProps {
  appendTo?: string | HTMLElement
  offset?: number | { mainAxis?: number; crossAxis?: number }
  placement?: 'top-center' | 'bottom-center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  preventOverflow?: boolean
  show?: boolean
  transitionProps?: TransitionProps
  triggerEvents?: TriggerEvents
}
