import { expect, test } from '@playwright/experimental-ct-vue'
import ExtensionCardFixture from './ExtensionCard.fixture.vue'

test.describe('standalone ExtensionCard', () => {
  test('renders direct presentation props without an item', async ({ mount }) => {
    const component = await mount(ExtensionCardFixture)
    const card = component.getByTestId('presentation-card')

    await expect(card.locator('.tr-extension-card__name')).toHaveText('Item name')
    await expect(card.locator('.tr-extension-card__description')).toHaveText('Item description')
    await expect(card.locator('img')).toHaveAttribute('src', 'https://example.com/item-icon.png')
    await expect(card.locator('img')).toHaveAttribute('alt', 'Item name')
  })

  test('renders a component icon without an image element', async ({ mount }) => {
    const component = await mount(ExtensionCardFixture)
    const card = component.getByTestId('component-icon-card')

    await expect(card.locator('img')).toHaveCount(0)
    await expect(card.locator('svg')).toHaveCount(1)
  })

  test('filters hidden actions before partitioning and keeps disabled slots in the primary region', async ({
    mount,
  }) => {
    const component = await mount(ExtensionCardFixture)
    const card = component.getByTestId('actions-card')
    const primaryRegion = card.locator('.tr-extension-card-primary-actions')
    const overflowRegion = card.locator('.tr-extension-card__more-action')
    const overflowMenu = overflowRegion.locator('.tr-extension-card__more-menu')

    await expect(primaryRegion.getByRole('checkbox', { name: '启用扩展' })).toBeVisible()
    await expect(primaryRegion.getByRole('button', { name: '禁用操作' })).toBeDisabled()
    await expect(primaryRegion.getByRole('button', { name: '隐藏操作' })).toHaveCount(0)
    await expect(primaryRegion.getByRole('button', { name: '安装' })).toHaveCount(0)
    await expect(primaryRegion.getByRole('button', { name: '检查' })).toHaveCount(0)
    await expect(overflowRegion.getByRole('button', { name: '扩展操作' })).toBeVisible()
    await expect(overflowMenu).toBeHidden()

    await overflowRegion.getByRole('button', { name: '扩展操作' }).click()
    await expect(primaryRegion.getByRole('checkbox', { name: '启用扩展' })).toBeVisible()
    await expect(primaryRegion.getByRole('button', { name: '禁用操作' })).toBeDisabled()
    await expect(primaryRegion.getByRole('button', { name: '安装' })).toHaveCount(0)
    await expect(primaryRegion.getByRole('button', { name: '检查' })).toHaveCount(0)
    await expect(overflowMenu).toBeVisible()
    await expect(overflowMenu.getByRole('button', { name: '安装' })).toBeVisible()
    await expect(overflowMenu.getByRole('button', { name: '检查' })).toBeVisible()
    await expect(overflowMenu.getByRole('checkbox', { name: '启用扩展' })).toHaveCount(0)
    await expect(overflowMenu.getByRole('button', { name: '禁用操作' })).toHaveCount(0)
    await expect(overflowMenu.getByRole('button', { name: '隐藏操作' })).toHaveCount(0)
  })

  test('falls back to a normal button for a custom primary action without a slot', async ({ mount }) => {
    const component = await mount(ExtensionCardFixture)
    const card = component.getByTestId('custom-fallback-card')

    await expect(card.getByRole('button', { name: '自定义操作' })).toBeVisible()
    await card.getByRole('button', { name: '自定义操作' }).click()
    await expect(component.getByTestId('event-id')).toHaveText('fallback')
    await expect(component.getByTestId('event-type')).toHaveText('custom')
  })

  test('uses overflowMenuLabel and emits switch state from the overflow menu', async ({ mount }) => {
    const component = await mount(ExtensionCardFixture)
    const card = component.getByTestId('overflow-switch-card')
    const trigger = card.getByRole('button', { name: '扩展操作' })

    await expect(trigger).toBeVisible()
    await expect(trigger).toHaveAttribute('title', '扩展操作')
    await trigger.click()

    const switchItem = card.getByRole('button', { name: '启用扩展' })

    await expect(switchItem).toHaveAttribute('aria-pressed', 'true')
    await expect(switchItem.getByText('✓')).toBeVisible()
    await switchItem.click()
    await expect(component.getByTestId('event-id')).toHaveText('overflow-enabled')
    await expect(component.getByTestId('event-type')).toHaveText('switch')
    await expect(component.getByTestId('event-checked')).toHaveText('false')

    await trigger.click()
    await expect(card.getByRole('button', { name: '启用扩展' })).toHaveAttribute('aria-pressed', 'false')
  })

  test('renders custom overflow actions as buttons and keeps danger styling', async ({ mount }) => {
    const component = await mount(ExtensionCardFixture)
    const card = component.getByTestId('overflow-switch-card')

    await card.getByRole('button', { name: '扩展操作' }).click()

    const customItem = card.getByRole('button', { name: '自定义溢出操作' })
    const dangerItem = card.getByRole('button', { name: '危险操作' })

    await expect(customItem).toBeVisible()
    await expect(dangerItem).toHaveClass(/is-danger/)
    await customItem.click()
    await expect(component.getByTestId('event-id')).toHaveText('overflow-custom')
    await expect(component.getByTestId('event-type')).toHaveText('custom')
  })

  test('shows hover and pressed feedback for enabled primary buttons only', async ({ mount, page }) => {
    const component = await mount(ExtensionCardFixture)
    const card = component.getByTestId('button-feedback-card')
    const button = card.getByRole('button', { name: '反馈按钮', exact: true })
    const disabledButton = card.getByRole('button', { name: '禁用反馈按钮', exact: true })
    const readBackground = (locator: typeof button) =>
      locator.evaluate((element) => getComputedStyle(element).backgroundColor)

    const baseBackground = await readBackground(button)
    await button.hover()
    await expect.poll(() => readBackground(button)).not.toBe(baseBackground)
    const hoverBackground = await readBackground(button)

    const box = await button.boundingBox()
    if (!box) throw new Error('Expected the primary button to have a layout box')
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await expect.poll(() => readBackground(button)).not.toBe(hoverBackground)
    await page.mouse.up()

    const disabledBackground = await readBackground(disabledButton)
    await disabledButton.hover()
    await expect.poll(() => readBackground(disabledButton)).toBe(disabledBackground)
  })

  test('aligns labels with a conditional icon slot in mixed-icon More Actions', async ({ mount }) => {
    const component = await mount(ExtensionCardFixture)
    const card = component.getByTestId('mixed-icon-menu-card')

    await card.getByRole('button', { name: '更多操作' }).click()
    const menu = card.locator('.tr-extension-card__more-menu')
    const labels = menu.locator('.tr-extension-card__more-menu-item > span:last-child')

    await expect(menu.locator('.tr-extension-card__more-menu-item-icon')).toHaveCount(1)
    await expect(menu.locator('[aria-hidden="true"]')).toHaveCount(1)
    const iconLabelBox = await labels.nth(0).boundingBox()
    const plainLabelBox = await labels.nth(1).boundingBox()

    if (!iconLabelBox || !plainLabelBox) throw new Error('Expected both menu labels to have layout boxes')
    expect(Math.abs(iconLabelBox.x - plainLabelBox.x)).toBeLessThan(1)
  })

  test('does not render icon slots when all visible More Actions have no icon', async ({ mount }) => {
    const component = await mount(ExtensionCardFixture)
    const card = component.getByTestId('no-icon-menu-card')

    await card.getByRole('button', { name: '更多操作' }).click()
    const menu = card.locator('.tr-extension-card__more-menu')

    await expect(menu.locator('.tr-extension-card__more-menu-item-icon')).toHaveCount(0)
    await expect(menu.locator('[aria-hidden="true"]')).toHaveCount(0)
  })

  test('keeps labels aligned when mixed More Actions also reserve a switch column', async ({ mount }) => {
    const component = await mount(ExtensionCardFixture)
    const card = component.getByTestId('mixed-icon-switch-menu-card')

    await card.getByRole('button', { name: '更多操作' }).click()
    const menu = card.locator('.tr-extension-card__more-menu')
    const labels = menu.locator('.tr-extension-card__more-menu-item > span:last-child')

    await expect(menu.locator('.tr-extension-card__more-menu-item-icon-slot')).toHaveCount(2)
    await expect(menu.locator('.tr-extension-card__more-menu-item-check-slot')).toHaveCount(2)
    const buttonLabelBox = await labels.nth(0).boundingBox()
    const switchLabelBox = await labels.nth(1).boundingBox()

    if (!buttonLabelBox || !switchLabelBox) throw new Error('Expected both mixed menu labels to have layout boxes')
    expect(Math.abs(buttonLabelBox.x - switchLabelBox.x)).toBeLessThan(1)
  })

  test('uses Card CSS variables for action icon size and menu icon slot size', async ({ mount }) => {
    const component = await mount(ExtensionCardFixture)
    const card = component.getByTestId('custom-icon-size-card')

    await expect(card.locator('.tr-extension-card-primary-actions__button-icon')).toHaveCSS('width', '20px')
    await card.getByRole('button', { name: '更多操作' }).click()

    const menu = card.locator('.tr-extension-card__more-menu')
    await expect(menu.locator('.tr-extension-card__more-menu-item-icon')).toHaveCSS('width', '20px')
    await expect(menu.locator('[aria-hidden="true"]')).toHaveCSS('width', '24px')
  })

  test('renders indeterminate and clamped determinate progress', async ({ mount }) => {
    const component = await mount(ExtensionCardFixture)

    await expect(component.getByTestId('progress-card').locator('.tr-extension-card__progress-bar')).toHaveClass(
      /is-indeterminate/,
    )
    await expect(
      component.getByTestId('high-progress-card').locator('.tr-extension-card__progress-bar'),
    ).toHaveAttribute('style', /width: 100%/)
    await expect(
      component.getByTestId('low-progress-card').locator('.tr-extension-card__progress-bar'),
    ).toHaveAttribute('style', /width: 0%/)
  })

  test('warns once per duplicate action ID set in development', async ({ mount, page }) => {
    const duplicateActionWarnings: string[] = []
    page.on('console', (message) => {
      if (
        message.type() === 'warning' &&
        message.text().includes('[ExtensionManager.Card] Action ids must be unique')
      ) {
        duplicateActionWarnings.push(message.text())
      }
    })

    const component = await mount(ExtensionCardFixture)

    await expect.poll(() => duplicateActionWarnings).toHaveLength(1)
    await expect.poll(() => duplicateActionWarnings[0] ?? '').toContain('duplicate-initial')

    await component.getByTestId('replace-duplicate-actions').click()
    await expect.poll(() => duplicateActionWarnings).toHaveLength(1)

    await component.getByTestId('change-duplicate-actions').click()
    await expect.poll(() => duplicateActionWarnings).toHaveLength(2)
    await expect.poll(() => duplicateActionWarnings[1] ?? '').toContain('duplicate-changed')
  })
})
