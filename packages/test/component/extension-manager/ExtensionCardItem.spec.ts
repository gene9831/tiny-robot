import { expect, test } from '@playwright/experimental-ct-vue'
import ExtensionCardItemFixture from './ExtensionCardItem.fixture.vue'

test.describe('ExtensionCard item API', () => {
  test('uses item for presentation fields that are not supplied directly', async ({ mount }) => {
    const component = await mount(ExtensionCardItemFixture)
    const card = component.getByTestId('item-fallback-card')

    await expect(card.locator('.tr-extension-card__name')).toHaveText('Item name')
    await expect(card.locator('.tr-extension-card__description')).toHaveText('Item description')
    await expect(card.locator('img')).toHaveAttribute('src', 'https://example.com/explicit-icon.png')
    await expect(card.locator('img')).toHaveAttribute('alt', 'Item icon alt')
  })

  test('gives explicitly supplied item fields priority over item', async ({ mount }) => {
    const component = await mount(ExtensionCardItemFixture)
    const card = component.getByTestId('explicit-override-card')

    await expect(card.locator('.tr-extension-card__name')).toHaveText('Explicit name')
    await expect(card.locator('.tr-extension-card__description')).toHaveText('Explicit description')
    await expect(card.locator('img')).toHaveAttribute('src', 'https://example.com/item-icon.png')
    await expect(card.locator('img')).toHaveAttribute('alt', 'Explicit icon alt')
  })
})
