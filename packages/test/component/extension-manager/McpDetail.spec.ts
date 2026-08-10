import { expect, test } from '@playwright/experimental-ct-vue'
import McpDetailFixture from './McpDetail.fixture.vue'

test.describe('McpDetail', () => {
  test('keeps parent enablement and tool preferences independent without mutating the item', async ({ mount }) => {
    const component = await mount(McpDetailFixture)
    const detail = component.getByTestId('with-parent-toggle')
    const parent = detail.getByRole('checkbox', { name: 'Extension enabled' })
    const readDocs = detail.getByRole('checkbox', { name: 'Read docs' })
    const searchDocs = detail.getByRole('checkbox', { name: 'Search docs' })

    await expect(parent).not.toBeChecked()
    await expect(parent).toBeDisabled()
    await expect(readDocs).toBeChecked()
    await expect(searchDocs).not.toBeChecked()
    await expect(
      component.getByTestId('without-parent-toggle').getByRole('checkbox', { name: 'Extension enabled' }),
    ).toHaveCount(0)

    await readDocs.click()

    await expect(component.getByTestId('last-toggle')).toHaveText(
      '{"id":"documentation-mcp","kind":"mcp","toolId":"read-docs","enabled":false}',
    )
    await expect(component.getByTestId('parent-enabled')).toHaveText('false')
    await expect(component.getByTestId('tool-preferences')).toHaveText(
      '{"read-docs":{"enabled":true},"search-docs":{"enabled":false}}',
    )
    await expect(searchDocs).not.toBeChecked()
  })
})
