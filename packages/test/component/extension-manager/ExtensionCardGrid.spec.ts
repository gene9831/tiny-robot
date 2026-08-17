import { expect, test } from '@playwright/experimental-ct-vue'
import ExtensionCardGridFixture from './ExtensionCardGrid.fixture.vue'

test.describe('standalone ExtensionCardGrid', () => {
  test('renders flat items as default Cards and keeps the Grid id on the item li', async ({ mount }) => {
    const component = await mount(ExtensionCardGridFixture)
    const grid = component.getByTestId('default-grid')
    const alphaItem = grid.locator(':scope > li[data-card-id="alpha"]')
    const alphaCard = alphaItem.locator(':scope > *')

    await expect(grid).toHaveJSProperty('tagName', 'UL')
    await expect(grid.locator(':scope > li')).toHaveCount(2)
    await expect(grid.locator(':scope > li[data-card-id]')).toHaveCount(2)
    await expect(alphaItem).toHaveCount(1)
    await expect(grid.locator(':scope > li[data-card-id="alpha"]')).toHaveCount(1)
    await expect(grid.locator('[id="alpha"]')).toHaveCount(0)
    await expect(alphaCard).toHaveCount(1)
    await expect(alphaCard).not.toHaveAttribute('id')
    await expect(alphaCard.getByText('Alpha extension', { exact: true })).toBeVisible()
    await expect(alphaCard.getByText('Alpha description', { exact: true })).toBeVisible()
    await expect(alphaCard.getByRole('checkbox', { name: 'Enable Alpha' })).toBeVisible()
    await expect(alphaCard.getByRole('button', { name: 'Install Alpha' })).toBeVisible()
    await expect(alphaCard.getByRole('button', { name: 'Inspect Alpha' })).toBeVisible()
  })

  test('passes the full flat item and index to the item slot while retaining Grid-owned markup', async ({ mount }) => {
    const component = await mount(ExtensionCardGridFixture)
    const grid = component.getByTestId('slot-grid')
    const alphaItem = grid.locator(':scope > li[data-card-id="alpha"]')
    const betaItem = grid.locator(':scope > li[data-card-id="beta"]')

    await expect(grid).toHaveJSProperty('tagName', 'UL')
    await expect(grid.locator(':scope > li')).toHaveCount(2)
    await expect(grid.locator(':scope > li[data-card-id]')).toHaveCount(2)
    await expect(alphaItem.locator(':scope > [data-testid="slot-item-alpha"]')).toHaveCount(1)
    await expect(alphaItem.getByTestId('slot-item-alpha-value')).toHaveText(
      '{"id":"alpha","name":"Alpha extension","description":"Alpha description","icon":"https://example.com/alpha-icon.png","actions":[{"id":"toggle-alpha","type":"switch","label":"Enable Alpha","checked":true,"icon":"[component]","hidden":false,"disabled":false,"danger":false},{"id":"install-alpha","type":"button","label":"Install Alpha","icon":"[component]","hidden":false,"disabled":false,"danger":false},{"id":"inspect-alpha","type":"custom","label":"Inspect Alpha","icon":"[component]","hidden":false,"disabled":false,"danger":false,"data":{"origin":"grid-fixture","nested":{"enabled":true}}}],"primaryActionsLimit":3,"progress":75,"nameClickable":true,"overflowMenuLabel":"Alpha actions","overflowMenuPlacement":"top-end"}',
    )
    await expect(alphaItem.getByTestId('slot-item-alpha-index')).toHaveText('0')
    await expect(betaItem.getByTestId('slot-item-beta-value')).toHaveText(
      '{"id":"beta","name":"Beta extension","description":"Beta description","nameClickable":false}',
    )
    await expect(betaItem.getByTestId('slot-item-beta-index')).toHaveText('1')
  })

  test('wraps default Card actions and controlled name clicks with the item id', async ({ mount }) => {
    const component = await mount(ExtensionCardGridFixture)
    const card = component.getByTestId('default-grid').locator(':scope > li[data-card-id="alpha"] > *')

    await card.getByRole('checkbox', { name: 'Enable Alpha' }).uncheck({ force: true })
    await card.getByRole('button', { name: 'Install Alpha' }).click()
    await card.getByRole('button', { name: 'Inspect Alpha' }).click()

    await expect(component.getByTestId('action-events')).toHaveText(
      'alpha:toggle-alpha:switch:false|alpha:install-alpha:button:|alpha:inspect-alpha:custom:',
    )

    await card.getByRole('button', { name: 'Alpha extension' }).click()
    await expect(component.getByTestId('name-click-item-id')).toHaveText('alpha')
  })

  test('renders one empty li and gives the empty slot precedence over emptyText', async ({ mount }) => {
    const component = await mount(ExtensionCardGridFixture)

    const defaultEmptyGrid = component.getByTestId('default-empty-grid')
    await expect(defaultEmptyGrid).toHaveJSProperty('tagName', 'UL')
    await expect(defaultEmptyGrid.locator(':scope > li')).toHaveCount(1)
    await expect(defaultEmptyGrid.locator(':scope > li')).toHaveText('暂无内容')

    const textEmptyGrid = component.getByTestId('text-empty-grid')
    await expect(textEmptyGrid).toHaveJSProperty('tagName', 'UL')
    await expect(textEmptyGrid.locator(':scope > li')).toHaveCount(1)
    await expect(textEmptyGrid.locator(':scope > li')).toHaveText('Nothing to show')

    const slotEmptyGrid = component.getByTestId('slot-empty-grid')
    await expect(slotEmptyGrid).toHaveJSProperty('tagName', 'UL')
    await expect(slotEmptyGrid.locator(':scope > li')).toHaveCount(1)
    await expect(slotEmptyGrid.getByTestId('custom-empty')).toHaveText('Custom empty slot')
    await expect(slotEmptyGrid.getByText('Fallback empty text', { exact: true })).toHaveCount(0)
  })

  test('uses the container width and card minimum-width variable to derive tracks', async ({ mount }) => {
    const component = await mount(ExtensionCardGridFixture)
    const readRenderedTrackCount = (testId: string) =>
      component.getByTestId(testId).evaluate((element) => {
        const style = getComputedStyle(element)
        if (style.display !== 'grid' || style.gridTemplateColumns === 'none') return 0

        const leftPositions = Array.from(element.children, (child) => Math.round(child.getBoundingClientRect().left))
        return new Set(leftPositions).size
      })

    await expect.poll(() => readRenderedTrackCount('default-min-width-grid')).toBe(2)
    await expect.poll(() => readRenderedTrackCount('narrow-min-width-grid')).toBe(1)
    await expect.poll(() => readRenderedTrackCount('custom-min-width-grid')).toBe(3)
  })

  test('warns once for each changed duplicate-id set', async ({ mount, page }) => {
    const duplicateWarnings: string[] = []
    page.on('console', (message) => {
      if (
        message.type() === 'warning' &&
        message.text().includes('[ExtensionManager.CardGrid] Item ids must be unique')
      ) {
        duplicateWarnings.push(message.text())
      }
    })

    const component = await mount(ExtensionCardGridFixture)
    await component.getByTestId('show-duplicate-grid').click()

    await expect.poll(() => duplicateWarnings).toHaveLength(1)
    await expect.poll(() => duplicateWarnings[0] ?? '').toContain('duplicate-initial')

    await component.getByTestId('replace-duplicate-items').click()
    await expect.poll(() => duplicateWarnings).toHaveLength(1)

    await component.getByTestId('change-duplicate-items').click()
    await expect.poll(() => duplicateWarnings).toHaveLength(2)
    await expect.poll(() => duplicateWarnings[1] ?? '').toContain('duplicate-changed')
  })
})
