import { expect, test } from '@playwright/experimental-ct-vue'
import McpExtensionNamespaceFixture from './McpExtensionNamespace.fixture.vue'

test.describe('MCP extension public namespace', () => {
  test('uses the exported MCP aliases for extension-manager and TinyRobot registration', async ({ mount }) => {
    const component = await mount(McpExtensionNamespaceFixture)

    await expect(component.getByTestId('detail-name')).toHaveText('McpExtensionDetail')
    await expect(component.getByTestId('form-name')).toHaveText('McpExtensionForm')
    await expect(component.getByTestId('detail-registration')).toHaveText('true')
    await expect(component.getByTestId('form-registration')).toHaveText('true')
  })
})
