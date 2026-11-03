export type ReplyMode = 'success' | 'failure'

export interface FakeReplyService {
  request(text: string, mode: ReplyMode, signal: AbortSignal): Promise<string>
}

export function createFakeReplyService(delayMs = 1_000): FakeReplyService {
  return {
    request(text, mode, signal) {
      return new Promise((resolve, reject) => {
        if (signal.aborted) {
          reject(new DOMException('Aborted', 'AbortError'))
          return
        }

        const onAbort = () => {
          clearTimeout(timer)
          reject(new DOMException('Aborted', 'AbortError'))
        }
        const timer = setTimeout(() => {
          signal.removeEventListener('abort', onAbort)
          if (mode === 'failure') {
            reject(new Error('模拟业务请求失败'))
            return
          }
          resolve(`业务数据层已收到：${text}`)
        }, delayMs)

        signal.addEventListener('abort', onAbort, { once: true })
      })
    },
  }
}
