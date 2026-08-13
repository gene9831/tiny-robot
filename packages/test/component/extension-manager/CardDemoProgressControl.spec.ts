import { expect, test } from '@playwright/experimental-ct-vue'
import CardStandaloneInstallDemo from '../../../demo/src/components/CardStandaloneInstallDemo.vue'

test.describe('ExtensionCard demo progress controls', () => {
  test('uses indeterminate progress as the opt-in inverse semantic in standalone demo', async ({ mount }) => {
    const component = await mount(CardStandaloneInstallDemo)
    const indeterminateProgress = component.getByRole('checkbox', { name: 'indeterminate progress' })

    await expect(indeterminateProgress).not.toBeChecked()
    await expect(component.getByRole('spinbutton', { name: 'progress' })).toBeEnabled()

    await indeterminateProgress.check()

    await expect(component.getByRole('spinbutton', { name: 'progress' })).toBeDisabled()
    await expect(component.locator('.tr-extension-card__progress-bar')).toHaveClass(/is-indeterminate/)
  })

  test('hides progress and labels the action as installed after success', async ({ mount }) => {
    const component = await mount(CardStandaloneInstallDemo)

    await component.getByLabel('install state').selectOption('success')

    await expect(component.getByRole('button', { name: '已安装' })).toBeVisible()
    await expect(component.locator('.tr-extension-card__progress-bar')).toHaveCount(0)
  })
})
