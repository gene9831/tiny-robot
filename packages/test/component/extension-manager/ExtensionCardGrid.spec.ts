import { expect, test } from '@playwright/experimental-ct-vue'
import ExtensionCardGridFixture from './ExtensionCardGrid.fixture.vue'

test.describe('standalone ExtensionCardGrid', () => {
  test('renders flat items as default Cards and keeps the Grid id on the item li', async ({ mount }) => {
    const component = await mount(ExtensionCardGridFixture)
    const grid = component.getByTestId('default-grid')
    const alphaItem = grid.locator('li[data-card-id="alpha"]')
    const alphaCard = alphaItem.locator(':scope > .tr-extension-card')

    await expect(alphaItem).toHaveCount(1)
    await expect(grid.locator('[data-card-id="alpha"]')).toHaveCount(1)
    await expect(grid.locator('[id="alpha"]')).toHaveCount(0)
    await expect(alphaCard).toHaveCount(1)
    await expect(alphaCard).not.toHaveAttribute('id')
    await expect(alphaCard.locator('.tr-extension-card__name')).toHaveText('Alpha extension')
    await expect(alphaCard.locator('.tr-extension-card__description')).toHaveText('Alpha description')
    await expect(alphaCard.getByRole('checkbox', { name: 'Enable Alpha' })).toBeVisible()
    await expect(alphaCard.getByRole('button', { name: 'Install Alpha' })).toBeVisible()
    await expect(alphaCard.getByRole('button', { name: 'Inspect Alpha' })).toBeVisible()
  })

  test('passes the full flat item and index to the item slot while retaining Grid-owned markup', async ({ mount }) => {
    const component = await mount(ExtensionCardGridFixture)
    const grid = component.getByTestId('slot-grid')
    const alphaItem = grid.locator('li[data-card-id="alpha"]')
    const betaItem = grid.locator('li[data-card-id="beta"]')

    await expect(grid.locator('li.tr-extension-card-grid__item')).toHaveCount(2)
    await expect(alphaItem.locator(':scope > [data-testid="slot-item-alpha"]')).toHaveCount(1)
    await expect(alphaItem.getByTestId('slot-item-alpha-value')).toHaveText(
      'alpha|Alpha extension|Alpha description|toggle-alpha,install-alpha,inspect-alpha|true',
    )
    await expect(alphaItem.getByTestId('slot-item-alpha-index')).toHaveText('0')
    await expect(betaItem.getByTestId('slot-item-beta-value')).toHaveText('beta|Beta extension|Beta description||false')
    await expect(betaItem.getByTestId('slot-item-beta-index')).toHaveText('1')
  })

  test('wraps default Card actions and controlled name clicks with the item id', async ({ mount }) => {
    const component = await mount(ExtensionCardGridFixture)
    const card = component.getByTestId('default-grid').locator('li[data-card-id="alpha"] .tr-extension-card')

    await card.locator('.tr-extension-card-primary-actions__switch-track').click()
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
    await expect(defaultEmptyGrid.locator('li.tr-extension-card-grid__empty')).toHaveCount(1)
    await expect(defaultEmptyGrid).toContainText('暂无内容')

    const textEmptyGrid = component.getByTestId('text-empty-grid')
    await expect(textEmptyGrid.locator('li.tr-extension-card-grid__empty')).toHaveCount(1)
    await expect(textEmptyGrid).toContainText('Nothing to show')

    const slotEmptyGrid = component.getByTestId('slot-empty-grid')
    await expect(slotEmptyGrid.locator('li.tr-extension-card-grid__empty')).toHaveCount(1)
    await expect(slotEmptyGrid.getByTestId('custom-empty')).toHaveText('Custom empty slot')
    await expect(slotEmptyGrid.getByText('Fallback empty text', { exact: true })).toHaveCount(0)
  })

  test('normalizes columns and does not warn for invalid values', async ({ mount, page }) => {
    const warnings: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'warning' && message.text().includes('[ExtensionManager.CardGrid]')) {
        warnings.push(message.text())
      }
    })

    const component = await mount(ExtensionCardGridFixture)
    const readColumns = (testId: string) =>
      component
        .getByTestId(testId)
        .evaluate((element) => getComputedStyle(element).getPropertyValue('--tr-extension-card-grid-columns').trim())

    await expect.poll(() => readColumns('columns-one')).toBe('1')
    await expect.poll(() => readColumns('columns-fraction')).toBe('2')
    await expect.poll(() => readColumns('columns-integer')).toBe('7')
    await expect.poll(() => readColumns('columns-zero')).toBe('2')
    await expect.poll(() => readColumns('columns-negative')).toBe('2')
    await expect.poll(() => readColumns('columns-nan')).toBe('2')
    await expect.poll(() => readColumns('columns-infinity')).toBe('2')
    await expect.poll(() => warnings).toHaveLength(0)
  })

  test('collapses the configured columns to one track on narrow viewports', async ({ mount, page }) => {
    const component = await mount(ExtensionCardGridFixture)
    const grid = component.getByTestId('responsive-grid')
    const readTrackCount = () =>
      grid.evaluate(
        (element) => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length,
      )

    await page.setViewportSize({ width: 1200, height: 800 })
    await expect.poll(readTrackCount).toBe(3)

    await page.setViewportSize({ width: 768, height: 800 })
    await expect.poll(readTrackCount).toBe(1)
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
