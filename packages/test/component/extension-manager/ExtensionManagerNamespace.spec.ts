import { expect, test } from '@playwright/experimental-ct-vue'
import ExtensionManagerNamespaceFixture from './ExtensionManagerNamespace.fixture.vue'

test.describe('ExtensionManager namespace', () => {
  test('exposes only the current Manager, Card, and CardGrid facade', async ({ mount }) => {
    const component = await mount(ExtensionManagerNamespaceFixture)

    await expect(component.getByTestId('manager-surface')).toBeVisible()
    await expect(component.getByTestId('manager-name')).toHaveText('ExtensionManager')
    await expect(component.getByTestId('manager-list')).toHaveText('false')
    await expect(component.getByTestId('root-exported')).toHaveText('false')
    await expect(component.getByTestId('filter-exported')).toHaveText('false')
    await expect(component.getByTestId('card-name')).toHaveText('ExtensionCard')
    await expect(component.getByTestId('card-grid-name')).toHaveText('ExtensionCardGrid')
    await expect(component.getByTestId('legacy-extension-exports')).toHaveText('')
    await expect(component.getByTestId('legacy-picker')).toHaveText('true')
    await expect(component.getByTestId('legacy-form')).toHaveText('true')
    await expect(component.getByTestId('extension-context-exported')).toHaveText('false')
    await expect(component.getByTestId('manager-registration')).toHaveText('true')
    await expect(component.getByTestId('content-registration')).toHaveText('false')
    await expect(component.getByTestId('root-registration')).toHaveText('false')
    await expect(component.getByTestId('filter-registration')).toHaveText('false')
    await expect(component.getByTestId('card-grid-registration')).toHaveText('true')
  })
})
