import { tryOnScopeDispose } from '@vueuse/core'
import {
  h,
  MaybeRefOrGetter,
  nextTick,
  render,
  Teleport,
  toValue,
  watch,
  ref,
  type TeleportProps,
  type VNode,
} from 'vue'

/**
 * useTeleportWithOpenClose
 *
 * 在组合式 API 中以编程方式渲染 Teleport 内容，并支持 open/close 控制显示隐藏，可配合 Transition 使用。
 *
 * @param to Teleport 的目标节点，可以是响应式或静态值
 * @param renderFn 返回 VNode 的渲染函数，参数为 isOpen
 * @returns open/close/isOpen/stop 方法
 *
 */
export function useTeleportWithOpenClose(to: MaybeRefOrGetter<TeleportProps['to']>, renderFn: () => VNode) {
  let vnode: VNode | null = null
  let container: HTMLElement | null = null
  const isOpen = ref(false)

  /**
   * 清理 Teleport 渲染内容和容器
   */
  const cleanup = () => {
    if (container) {
      render(null, container)
      container.remove()
      vnode = null
      container = null
    }
  }

  const rerender = () => {
    const target = toValue(to)
    nextTick(() => {
      if (!target) return
      if (!container) container = document.createElement('div')
      vnode = isOpen.value ? h(Teleport, { to: target }, renderFn()) : null
      render(vnode, container)
    })
  }

  const stopWatch = watch(
    () => toValue(to),
    () => {
      rerender()
    },
    { immediate: true },
  )

  const open = () => {
    if (!isOpen.value) {
      isOpen.value = true
      rerender()
    }
  }
  const close = () => {
    if (isOpen.value) {
      isOpen.value = false
      rerender()
    }
  }

  /**
   * 停止 Teleport 并清理资源
   */
  const stop = () => {
    stopWatch()
    nextTick(() => {
      cleanup()
    })
  }

  tryOnScopeDispose(stop)

  return { open, close, isOpen, stop }
}
