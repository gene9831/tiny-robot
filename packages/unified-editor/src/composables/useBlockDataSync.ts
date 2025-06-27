import { ref, computed, watchEffect, type Ref } from 'vue'
import type { ContentBlock } from '../types'

export type BlockDataSyncEmit = (event: 'update:modelValue', value: ContentBlock[]) => void

/**
 * 区块数据同步管理
 * 专门处理数据的双向同步，不直接操作 DOM
 */
export function useBlockDataSync(modelValue: Ref<ContentBlock[]>, emit: BlockDataSyncEmit) {
  // 内部数据状态
  const internalBlocks = ref<ContentBlock[]>([...modelValue.value])

  // 监听外部 modelValue 的变化
  watchEffect(() => {
    if (JSON.stringify(modelValue.value) !== JSON.stringify(internalBlocks.value)) {
      internalBlocks.value = [...modelValue.value]
    }
  })

  /**
   * 处理单个块的内容更新
   * 这是数据同步的核心方法，确保数据的一致性
   */
  const updateBlockContent = (blockIndex: number, newContent: string) => {
    // 边界检查
    if (blockIndex < 0 || blockIndex >= internalBlocks.value.length) {
      return false
    }

    const currentBlock = internalBlocks.value[blockIndex]

    // 内容没有变化时，不执行更新
    if (currentBlock.content === newContent) {
      return false
    }

    // 创建新的块对象，保持不可变性
    const updatedBlock: ContentBlock = {
      ...currentBlock,
      content: newContent,
    }

    // 创建新的数组，保持不可变性
    const newBlocks = [...internalBlocks.value]
    newBlocks[blockIndex] = updatedBlock

    // 更新内部状态
    internalBlocks.value = newBlocks

    // 向父组件发射更新事件
    emit('update:modelValue', newBlocks)

    return true
  }

  /**
   * 获取指定块的当前内容
   */
  const getBlockContent = (blockIndex: number): string => {
    if (blockIndex >= 0 && blockIndex < internalBlocks.value.length) {
      return internalBlocks.value[blockIndex].content
    }
    return ''
  }

  /**
   * 获取所有块的内容拼接字符串
   */
  const getAllContent = (): string => {
    return internalBlocks.value.map((block) => block.content).join('')
  }

  /**
   * 重置到初始状态
   */
  const reset = () => {
    internalBlocks.value = [...modelValue.value]
  }

  return {
    // 数据状态
    internalBlocks: computed(() => internalBlocks.value),

    // 数据操作方法
    updateBlockContent,
    getBlockContent,
    getAllContent,

    // 工具方法
    reset,
  }
}
