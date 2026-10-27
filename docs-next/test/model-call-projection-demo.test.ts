import { describe, expect, it } from 'vitest'
import { runModelCallProjectionDemo } from '../src/concepts/modelCallProjectionDemo'

describe('model call projection Demo', () => {
  it('shows the exact JSON-safe keys observed by the local model', async () => {
    const result = await runModelCallProjectionDemo('解释模型调用边界。', { terminalDelayMs: 0 })
    if (!result.ok) throw new Error('Expected a successful model call projection')

    expect(Object.keys(result.callOptions)).toEqual(['prompt', 'abortSignal'])
    expect(result.callOptions).toEqual({
      prompt: [{ role: 'user', content: [{ type: 'text', text: '解释模型调用边界。' }] }],
      abortSignal: 'available',
    })
  })

  it('returns a stable validation result for whitespace-only input', async () => {
    await expect(runModelCallProjectionDemo('\t ', { terminalDelayMs: 0 })).resolves.toEqual({
      ok: false,
      error: {
        code: 'empty-content',
        message: '请输入一条用户消息。',
      },
    })
  })
})
