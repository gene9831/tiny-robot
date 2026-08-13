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

  test('partitions visible actions by primaryActionsLimit', async ({ mount }) => {
    const component = await mount(ExtensionCardFixture)
    const card = component.getByTestId('actions-card')

    await expect(card.getByRole('checkbox', { name: '启用扩展' })).toBeVisible()
    await expect(card.getByRole('button', { name: '扩展操作' })).toBeVisible()
    await card.getByRole('button', { name: '扩展操作' }).click()
    await expect(card.getByRole('button', { name: '安装' })).toBeVisible()
    await expect(card.getByRole('button', { name: '检查' })).toBeVisible()
    await expect(card.getByRole('button', { name: '隐藏操作' })).toHaveCount(0)
    await expect(card.getByRole('button', { name: '禁用操作' })).toBeDisabled()
  })

  test('falls back to a normal button for a custom primary action without a slot', async ({ mount }) => {
    const component = await mount(ExtensionCardFixture)
    const card = component.getByTestId('custom-fallback-card')

    await expect(card.getByRole('button', { name: '自定义操作' })).toBeVisible()
    await card.getByRole('button', { name: '自定义操作' }).click()
    await expect(component.getByTestId('event-id')).toHaveText('fallback')
    await expect(component.getByTestId('event-type')).toHaveText('custom')
  })

  test('renders indeterminate and clamped determinate progress', async ({ mount }) => {
    const component = await mount(ExtensionCardFixture)

    await expect(component.getByTestId('progress-card').locator('.tr-extension-card__progress-bar')).toHaveClass(
      /is-indeterminate/,
    )
    await expect(component.getByTestId('high-progress-card').locator('.tr-extension-card__progress-bar')).toHaveAttribute(
      'style',
      /width: 100%/,
    )
    await expect(component.getByTestId('low-progress-card').locator('.tr-extension-card__progress-bar')).toHaveAttribute(
      'style',
      /width: 0%/,
    )
  })
})
