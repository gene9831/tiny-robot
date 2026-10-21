/** Returns a pass-through stream that observes each value before forwarding it unchanged. */
export function inspectStream<T>(stream: ReadableStream<T>, inspect: (value: T) => void): ReadableStream<T> {
  return stream.pipeThrough(
    new TransformStream<T, T>({
      transform(value, controller) {
        try {
          inspect(value)
        } catch {
          // Inspection is an observer-only diagnostic side channel.
        }
        controller.enqueue(value)
      },
    }),
  )
}
