import { test, expect } from '@playwright/test'
import { fileURLToPath } from 'node:url'

test.beforeEach(async ({ page }) => {
  // Local demo pages must remain usable without credentials or external services.
  await page.route(/^https?:\/\/(?!127\.0\.0\.1:4175(?:\/|$))/, (route) => route.abort())
})

test('chat can reopen a seeded conversation, stream a follow-up, and reset', async ({ page }) => {
  await page.goto('/#chat')
  await expect(page.getByText('1.0 有哪些适合先体验的能力？')).toBeVisible()
  await page.getByText('本周产品进展', { exact: true }).click()
  await expect(page.getByText('帮我梳理一下本周的产品进展。')).toBeVisible()
  const editor = page.locator('[contenteditable="true"]').first()
  const question = '把本周进展整理成三条周报要点。'
  await editor.fill(question)
  await page.locator('.tr-sender-submit-button').click()
  await expect(page.locator('.tr-bubble[data-role="user"]').getByText(question, { exact: true })).toBeVisible()
  await expect(page.getByText('完成会话切换和流式回复。')).toBeVisible()
  await expect(page.getByText('支持执行前确认与刷新后恢复。')).toBeVisible()
  await page.getByRole('button', { name: '重置当前场景' }).click()
  await expect(page.getByText('1.0 有哪些适合先体验的能力？')).toBeVisible()
})

test('extensions can install, import a real local Skill and reset', async ({ page }) => {
  await page.goto('/#extensions')
  await page.getByRole('tab', { name: 'Skills', exact: true }).click()
  await page.getByRole('button', { name: '安装', exact: true }).first().click()
  await expect(page.getByRole('switch', { name: '启用文档摘要' })).toBeChecked()
  await page.getByRole('button', { name: '导入本地 Skill' }).click()
  await page
    .locator('input[type=file]')
    .setInputFiles(fileURLToPath(new URL('../samples/weekly-report', import.meta.url)))
  await page.getByRole('button', { name: '确定', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(page.getByRole('switch', { name: '启用周报整理' })).toBeChecked()
  await page.getByRole('button', { name: '周报整理', exact: true }).click()
  await expect(page.getByRole('dialog').getByText('周报整理', { exact: true }).first()).toBeVisible()
  await page.getByRole('button', { name: '关闭详情' }).click()
  await page.getByRole('button', { name: '重置当前场景' }).click()
  await page.getByRole('tab', { name: 'Skills', exact: true }).click()
  await expect(page.getByRole('button', { name: '安装', exact: true }).first()).toBeVisible()
})

test('tool confirmation allows execution and supports rejection after reload', async ({ page }) => {
  await page.goto('/#approval')
  const editor = page.locator('.approval-scene [contenteditable="true"]')
  const send = page.locator('.approval-scene .tr-sender-submit-button:not(.is-disabled)')
  const request = '请把这份周报保存到团队工作区。'
  await editor.fill(request)
  await expect(send).toBeVisible()
  await editor.press('Enter')
  await expect(page.locator('.tr-bubble[data-role="user"]').getByText(request, { exact: true })).toBeVisible()
  const allow = page.getByRole('button', { name: '允许', exact: true })
  await expect(allow).toBeVisible()
  await allow.click()
  await expect(page.getByText('周报已保存到演示工作区。', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '重置当前场景' }).click()
  await editor.fill(request)
  await send.click()
  const reject = page.getByRole('button', { name: '拒绝', exact: true })
  await expect(reject).toBeVisible()
  await page.reload()
  await expect(page.locator('.tr-bubble[data-role="user"]').getByText(request, { exact: true })).toBeVisible()
  await expect(page.getByText('等待确认', { exact: true })).toBeVisible()
  await reject.click()
  await expect(page.getByText('已取消保存，周报内容保留在当前对话中。', { exact: true })).toBeVisible()
})

test('composer supports model/effort selection and clean capture mode', async ({ page }) => {
  await page.goto('/#composer')
  await page.getByRole('button', { name: '通用助手' }).click()
  await page.getByPlaceholder('搜索模型').fill('推理')
  await page.getByRole('option', { name: /推理助手/ }).click()
  await page.getByRole('button', { name: '深度', exact: true }).click()
  await expect(page.getByRole('button', { name: '深度', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: '推理助手 · 深度', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  const editor = page.locator('[contenteditable="true"]').first()
  await editor.fill('请整理本周进展')
  await expect(page.locator('.tr-sender-submit-button')).toBeVisible()
  await editor.press('Control+Enter')
  await expect(page.getByRole('status')).toContainText('请整理本周进展')
  await page.getByRole('button', { name: '隐藏录制控制栏' }).click()
  await expect(page.locator('[contenteditable="true"]').first()).toBeVisible()
  await expect(page.getByRole('navigation', { name: '录制场景' })).toBeHidden()
  await page.keyboard.press('Alt+r')
  await expect(page.getByRole('navigation', { name: '录制场景' })).toBeVisible()
})

test('task template can choose a source and submit the selected text', async ({ page }) => {
  await page.goto('/#composer')
  await page.getByRole('button', { name: '插入任务模板' }).click()
  await page.getByText('本周进展', { exact: true }).click()
  await page.getByText('会议记录', { exact: true }).click()
  await expect(page.locator('.tr-sender-submit-button')).toBeVisible()
  await page.locator('[contenteditable="true"]').first().press('Control+Enter')
  await expect(page.getByRole('status')).toHaveText('已提交：请把会议记录整理为一份结构清晰的文档。')
})

test('live chat sends a dropped image in the selected conversation', async ({ page }) => {
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jX4sAAAAASUVORK5CYII='
  const image = 'data:image/png;base64,' + png
  await page.route('**/__recording/bailian/chat/completions', (route) =>
    route.fulfill({
      contentType: 'text/event-stream',
      body: 'data: {"id":"test","choices":[{"index":0,"delta":{"role":"assistant","content":"已收到图片。"},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n',
    }),
  )

  await page.goto('/?clean=1#live-chat')
  await page.getByText('本周产品进展', { exact: true }).click()
  await expect(page.getByText('帮我梳理一下本周的产品进展。')).toBeVisible()
  const editor = page.locator('[contenteditable="true"]')
  const transfer = await page.evaluateHandle((base64) => {
    const data = new DataTransfer()
    data.items.add(
      new File([Uint8Array.from(atob(base64), (byte) => byte.charCodeAt(0))], '周报.png', { type: 'image/png' }),
    )
    return data
  }, png)
  await editor.dispatchEvent('drop', { dataTransfer: transfer })
  await expect(page.getByText('周报.png', { exact: true })).toBeVisible()
  await editor.fill('请说明这张图。')

  const sent = page.waitForRequest('**/__recording/bailian/chat/completions')
  await page.locator('.tr-sender-submit-button').click()
  expect((await sent).postDataJSON().messages.at(-1)).toEqual({
    role: 'user',
    content: [
      { type: 'text', text: '请说明这张图。' },
      { type: 'image_url', image_url: { url: image } },
    ],
  })
  await expect(page.locator('.tr-bubble__image')).toHaveAttribute('src', image)
  await expect(page.getByText('已收到图片。')).toBeVisible()
})
