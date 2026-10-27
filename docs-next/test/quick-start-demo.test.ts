import { describe, expect, it } from 'vitest'
import { runQuickStartDemo } from '../src/guide/quickStartDemo'

describe('quick-start local Demo', () => {
  it('submits one question and returns the completed answer read from Runtime state', async () => {
    await expect(runQuickStartDemo('请用一句话介绍北京的气候特点。', { terminalDelayMs: 0 })).resolves.toEqual({
      ok: true,
      question: '请用一句话介绍北京的气候特点。',
      answer: '北京属于温带季风气候，四季分明，夏季炎热多雨，冬季寒冷干燥。',
      status: 'completed',
      termination: 'stop',
    })
  })

  it('returns a stable validation result for whitespace-only input', async () => {
    await expect(runQuickStartDemo('   \n ', { terminalDelayMs: 0 })).resolves.toEqual({
      ok: false,
      error: {
        code: 'empty-content',
        message: '请输入问题后再提交。',
      },
    })
  })

  it('keeps consecutive runs isolated to the question submitted in that call', async () => {
    const first = await runQuickStartDemo('第一个问题', { terminalDelayMs: 0 })
    const second = await runQuickStartDemo('第二个问题', { terminalDelayMs: 0 })

    expect(first).toMatchObject({ ok: true, question: '第一个问题' })
    expect(second).toMatchObject({ ok: true, question: '第二个问题' })
  })
})
