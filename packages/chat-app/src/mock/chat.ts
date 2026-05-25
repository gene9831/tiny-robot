import type { ChatCompletion, MessageRequestBody, UseMessageOptions } from '@opentiny/tiny-robot-kit'

export const initialMessages = [
  {
    role: 'assistant',
    content: '您好，我是 AI 智能客服，请问有什么可以帮助您？',
  },
]

const mockReply =
  '您好，订单付款后未发货通常可能是商家备货、仓库排队或物流尚未揽收。建议您先查看订单页的预计发货时间，如果超过承诺时间，可以继续联系人工客服处理。'

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms)

    signal.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })

async function* createMockResponse(
  _requestBody: MessageRequestBody,
  abortSignal: AbortSignal,
): AsyncGenerator<ChatCompletion> {
  await wait(1000, abortSignal)

  if (Math.random() < 0.5) {
    throw new Error('Mock response failed')
  }

  for (const [index, char] of Array.from(mockReply).entries()) {
    await wait(24, abortSignal)

    yield {
      id: 'mock-chat',
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: 'mock-model',
      system_fingerprint: null,
      choices: [
        {
          index: 0,
          message: undefined,
          delta: {
            role: index === 0 ? 'assistant' : undefined,
            content: char,
          },
          logprobs: null,
          finish_reason: null,
        },
      ],
    }
  }

  yield {
    id: 'mock-chat',
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model: 'mock-model',
    system_fingerprint: null,
    choices: [
      {
        index: 0,
        message: undefined,
        delta: {},
        logprobs: null,
        finish_reason: 'stop',
      },
    ],
  }
}

export const mockResponseProvider = createMockResponse as UseMessageOptions['responseProvider']
