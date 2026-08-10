import { expect, test } from '@playwright/experimental-ct-vue'
import ExtensionCardItemFixture from './ExtensionCardItem.fixture.vue'

test.describe('ExtensionCard item API', () => {
  test('renders all presentation fields from its required extension item', async ({ mount }) => {
    const component = await mount(ExtensionCardItemFixture)
    const card = component.getByTestId('canonical-item-card')

    await expect(card.locator('.tr-extension-card__name')).toHaveText('Item name')
    await expect(card.locator('.tr-extension-card__description')).toHaveText('Item description')
    await expect(card.locator('img')).toHaveAttribute('src', 'https://example.com/item-icon.png')
    await expect(card.locator('img')).toHaveAttribute('alt', 'Item name')
  })
})
