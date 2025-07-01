export function useUndoRedo<T>(initial: T) {
  let undoStack: T[] = []
  let redoStack: T[] = []
  let currentValue: T = initial

  const commit = (newValue: T) => {
    undoStack.push(currentValue)
    currentValue = newValue
    redoStack = []
  }

  const undo = () => {
    if (undoStack.length) {
      redoStack.push(currentValue)
      currentValue = undoStack.pop() as T

      return currentValue
    }

    return null
  }

  const redo = () => {
    if (redoStack.length) {
      undoStack.push(currentValue)
      currentValue = redoStack.pop() as T

      return currentValue
    }

    return null
  }

  const clear = () => {
    undoStack = []
    redoStack = []
  }

  const get = () => currentValue

  return { commit, undo, redo, clear, get }
}
