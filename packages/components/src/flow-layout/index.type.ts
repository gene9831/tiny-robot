import { VNode } from 'vue'

export interface FlowLayoutProps {
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
   * 更多项目的展开方式，可选值为 'dropdown' 或 'expand'。默认值为 'expand'
   * - 'dropdown': 使用下拉菜单方式展开
   * - 'expand': 直接在容器中展开所有项目
   */
  expandMode?: 'dropdown' | 'expand'
  /**
   * 是否打开"更多"列表。默认关闭(v-model)
   */
  openMore?: boolean
  /**
   * 触发"更多"按钮显示的方式，可选值为 'click' 或 'hover'。默认值为 'click'，仅在 expandMode 为 'dropdown' 时有效
   */
  dropdownTrigger?: 'click' | 'hover'
}

export interface FlowLayoutSlots {
  default: () => VNode[]
  moreTrigger: (props: { active: boolean }) => VNode[]
}
