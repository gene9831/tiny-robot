import { VNode } from 'vue'

export interface FlowLayoutProps {
  /**
   * 显示的最大行数限制。默认不限制
   */
  linesLimit?: number
  /**
   * 是否打开“更多”列表。默认关闭(v-model)
   */
  openMore?: boolean
  /**
   * 触发“更多”按钮显示的方式，可选值为 'click' 或 'hover'。默认值为 'click'
   */
  openMoreTrigger?: 'click' | 'hover'
}

export interface FlowLayoutSlots {
  default: () => VNode[]
  moreTrigger: () => VNode[]
}
