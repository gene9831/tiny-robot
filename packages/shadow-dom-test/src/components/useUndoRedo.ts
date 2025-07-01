import { ref } from 'vue'

export function useUndoRedo<T>(initial: T) {
  const undoStack = ref<T[]>([])
  const redoStack = ref<T[]>([])
  const state = ref(initial)

  const commit = (newValue: T) => {
    undoStack.value.push(state.value)
    state.value = newValue
    redoStack.value = []
  }

  const undo = () => {
    if (undoStack.value.length) {
      redoStack.value.push(state.value)
      state.value = undoStack.value.pop()!
    }
  }

  const redo = () => {
    if (redoStack.value.length) {
      undoStack.value.push(state.value)
      state.value = redoStack.value.pop()!
    }
  }

  return { state, commit, undo, redo }
}
