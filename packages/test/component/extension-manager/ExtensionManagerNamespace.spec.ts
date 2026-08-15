import { expect, test } from '@playwright/experimental-ct-vue'
import ExtensionManagerNamespaceFixture from './ExtensionManagerNamespace.fixture.vue'

test.describe('ExtensionManager namespace', () => {
  test('exposes the Manager facade namespace while retaining legacy MCP exports', async ({ mount }) => {
    const component = await mount(ExtensionManagerNamespaceFixture)

    await expect(component.getByTestId('manager-surface')).toBeVisible()
    await expect(component.getByTestId('manager-name')).toHaveText('ExtensionManager')
    await expect(component.getByTestId('manager-list')).toHaveText('false')
    await expect(component.getByTestId('root-name')).toHaveText('ExtensionManagerRoot')
    await expect(component.getByTestId('filter-name')).toHaveText('ExtensionFilter')
    await expect(component.getByTestId('card-name')).toHaveText('ExtensionCard')
    await expect(component.getByTestId('card-grid-name')).toHaveText('ExtensionCardGrid')
    await expect(component.getByTestId('detail-name')).toHaveText('McpDetail')
    await expect(component.getByTestId('form-name')).toHaveText('McpForm')
    await expect(component.getByTestId('standalone-primitives')).toHaveText('')
    await expect(component.getByTestId('legacy-picker')).toHaveText('true')
    await expect(component.getByTestId('legacy-form')).toHaveText('true')
    await expect(component.getByTestId('manager-registration')).toHaveText('true')
    await expect(component.getByTestId('content-registration')).toHaveText('false')
    await expect(component.getByTestId('detail-registration')).toHaveText('true')
    await expect(component.getByTestId('form-registration')).toHaveText('true')
    await expect(component.getByTestId('card-grid-registration')).toHaveText('true')
  })
})
