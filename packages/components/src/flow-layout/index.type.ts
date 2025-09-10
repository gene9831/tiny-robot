import { VNode } from 'vue'

export interface FlowLayoutProps<T = unknown> {
  items: T[]
  gap?:
    | number
    | string
    | {
        rowGap?: number | string
        columnGap?: number | string
      }
  /**
   * 显示的最大行数限制。默认不限制
   */
  linesLimit?: number
  /**
   * "更多"触发器的最小宽度。此宽度不是元素的实际宽度，是用于计算当前行是否能容纳"更多"触发器。不指定则取元素实际宽度，如果你的"更多"触发器的宽度是动态的，建议指定一个较大的宽度，否则可能导致布局异常
   */
  moreTriggerMinWidth?: number
}

export interface FlowLayoutSlots<T = unknown> {
  item: (props: { item: T; index: number }) => VNode[]
  moreTrigger: (props: { visibleItemCount: number }) => VNode[]
}
