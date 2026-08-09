import { expect, test } from '@playwright/experimental-ct-vue'
import McpExtensionDetailFixture from './McpExtensionDetail.fixture.vue'

test.describe('McpExtensionDetail', () => {
  test('keeps tool preferences independently interactive when the parent extension is disabled', async ({ mount }) => {
    const component = await mount(McpExtensionDetailFixture)
    const readDocs = component.getByRole('checkbox', { name: 'Read docs' })
    const searchDocs = component.getByRole('checkbox', { name: 'Search docs' })

    await expect(readDocs).toBeChecked()
    await expect(searchDocs).not.toBeChecked()
    await expect(readDocs).toBeEnabled()
    await expect(searchDocs).toBeEnabled()

    await readDocs.click()

    await expect(component.getByTestId('last-toggle')).toHaveText('{"toolId":"read-docs","enabled":false}')
    await expect(component.getByTestId('parent-enabled')).toHaveText('false')
    await expect(component.getByTestId('tool-states')).toHaveText(
      '[{"id":"read-docs","name":"Read docs","description":"Read documentation pages.","enabled":true},{"id":"search-docs","name":"Search docs","description":"Search documentation pages.","enabled":false}]',
    )
    await expect(searchDocs).not.toBeChecked()
  })
})
