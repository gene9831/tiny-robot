import { expect, test } from '@playwright/experimental-ct-vue'
import CardProgressDemo from '../../../demo/src/components/CardProgressDemo.vue'

test.describe('Card demo progress controls', () => {
  test('disables the Value control and shows indeterminate progress in indeterminate mode', async ({ mount }) => {
    const component = await mount(CardProgressDemo)
    const mode = component.getByLabel('Mode')

    await expect(mode).toHaveValue('determinate')
    await expect(component.getByRole('spinbutton', { name: 'Value' })).toBeEnabled()

    await mode.selectOption('indeterminate')

    await expect(component.getByRole('spinbutton', { name: 'Value' })).toBeDisabled()
    await expect(component.locator('.tr-extension-card__progress-bar')).toHaveClass(/is-indeterminate/)
  })

  test('shows the Complete status and hides progress in hidden mode', async ({ mount }) => {
    const component = await mount(CardProgressDemo)

    await component.getByLabel('Mode').selectOption('hidden')

    await expect(component.getByText('Complete', { exact: true })).toBeVisible()
    await expect(component.locator('.tr-extension-card__progress-bar')).toHaveCount(0)
  })
})
