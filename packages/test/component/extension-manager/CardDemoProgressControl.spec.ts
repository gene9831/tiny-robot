import { expect, test } from '@playwright/experimental-ct-vue'
import CardProgressDemo from '../../../demo/src/components/CardProgressDemo.vue'

test.describe('Card 演示进度控制', () => {
  test('不确定进度模式会禁用数值控件并显示不确定进度', async ({ mount }) => {
    const component = await mount(CardProgressDemo)
    const mode = component.getByLabel('模式')

    await expect(mode).toHaveValue('determinate')
    await expect(component.getByRole('spinbutton', { name: '数值' })).toBeEnabled()

    await mode.selectOption('indeterminate')

    await expect(component.getByRole('spinbutton', { name: '数值' })).toBeDisabled()
    await expect(component.locator('.tr-extension-card__progress-bar')).toHaveClass(/is-indeterminate/)
  })

  test('隐藏模式会显示完成状态并隐藏进度条', async ({ mount }) => {
    const component = await mount(CardProgressDemo)

    await component.getByLabel('模式').selectOption('hidden')

    await expect(component.getByText('完成', { exact: true })).toBeVisible()
    await expect(component.locator('.tr-extension-card__progress-bar')).toHaveCount(0)
  })
})
