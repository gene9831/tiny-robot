import { expect, test } from '@playwright/experimental-ct-vue'
import McpFormFixture from './McpForm.fixture.vue'

test.describe('McpForm', () => {
  test('submits a structured form definition from controlled initial values', async ({ mount }) => {
    const component = await mount(McpFormFixture)
    const formAdapter = component.getByTestId('form-adapter')

    await formAdapter.getByLabel('Name').fill('Updated Docs')
    await formAdapter.getByRole('button', { name: 'Submit' }).click()

    await expect(component.getByTestId('form-payload')).toHaveText(
      '{"mode":"form","data":{"name":"Updated Docs","description":"Documentation server","transport":"streamableHttp","url":"https://example.test/mcp","headers":{"Authorization":"Bearer token"}}}',
    )
    await expect(component.getByTestId('definition')).toHaveText(
      '{"name":"Docs","description":"Documentation server","transport":"streamableHttp","url":"https://example.test/mcp","headers":{"Authorization":"Bearer token"}}',
    )
  })

  test('updates the selected mode and submits local code editing', async ({ mount }) => {
    const component = await mount(McpFormFixture)
    const formAdapter = component.getByTestId('form-adapter')
    const codeAdapter = component.getByTestId('code-adapter')

    await formAdapter.getByRole('radio', { name: 'Code' }).check()
    await expect(component.getByTestId('mode')).toHaveText('code')

    await codeAdapter.getByLabel('MCP configuration').fill('{"name":"Updated MCP"}')
    await codeAdapter.getByRole('button', { name: 'Submit' }).click()

    await expect(component.getByTestId('code-payload')).toHaveText(
      '{"mode":"code","data":"{\\"name\\":\\"Updated MCP\\"}"}',
    )
  })

  test('emits cancellation without rendering a dialog container', async ({ mount }) => {
    const component = await mount(McpFormFixture)

    await component.getByTestId('form-adapter').getByRole('button', { name: 'Cancel' }).click()

    await expect(component.getByTestId('cancel-count')).toHaveText('1')
    await expect(component.locator('[role="dialog"]')).toHaveCount(0)
  })
})
