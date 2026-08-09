import { expect, test } from '@playwright/experimental-ct-vue'
import McpExtensionFormFixture from './McpExtensionForm.fixture.vue'

test.describe('McpExtensionForm', () => {
  test('normalizes a form confirmation into a form payload', async ({ mount }) => {
    const component = await mount(McpExtensionFormFixture)
    const formAdapter = component.getByTestId('form-adapter')

    await formAdapter.locator('.mcp-add-form__footer .confirm').click()

    await expect(component.getByTestId('form-payload')).toHaveText(
      '{"mode":"form","data":{"name":"Documentation MCP","description":"Provides documentation tools.","type":"streamableHttp","url":"https://example.com/mcp","headers":"{\\"authorization\\":\\"Bearer token\\"}","thumbnail":null}}',
    )
  })

  test('normalizes a code confirmation into a code payload', async ({ mount }) => {
    const component = await mount(McpExtensionFormFixture)
    const codeAdapter = component.getByTestId('code-adapter')

    await codeAdapter.locator('.code-editor__textarea').fill('{"name":"Updated MCP"}')
    await codeAdapter.locator('.mcp-add-form__footer .confirm').click()

    await expect(component.getByTestId('code-payload')).toHaveText(
      '{"mode":"code","data":"{\\"name\\":\\"Updated MCP\\"}"}',
    )
  })

  test('forwards cancellation without owning a dialog container', async ({ mount }) => {
    const component = await mount(McpExtensionFormFixture)

    await component.getByTestId('form-adapter').locator('.mcp-add-form__footer .cancel').click()

    await expect(component.getByTestId('cancel-count')).toHaveText('1')
    await expect(component.locator('[role="dialog"]')).toHaveCount(0)
  })
})
