import { expect, test } from '@playwright/experimental-ct-vue'
import McpExtensionNamespaceFixture from './McpExtensionNamespace.fixture.vue'

test.describe('MCP extension component namespace', () => {
  test('registers the independent MCP namespace members without standalone aliases', async ({ mount }) => {
    const component = await mount(McpExtensionNamespaceFixture)

    await expect(component.getByTestId('detail-name')).toHaveText('McpDetail')
    await expect(component.getByTestId('form-name')).toHaveText('McpForm')
    await expect(component.getByTestId('detail-registration')).toHaveText('true')
    await expect(component.getByTestId('form-registration')).toHaveText('true')
  })
})
