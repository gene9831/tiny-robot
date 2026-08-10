import { expect, test } from '@playwright/experimental-ct-vue'
import ExtensionManagerFixture from './ExtensionManager.fixture.vue'

test.describe('ExtensionManager facade', () => {
  test('composes canonical sections, Filter projection, and install intents without mutating the catalog', async ({
    mount,
  }) => {
    const component = await mount(ExtensionManagerFixture)

    const sections = component.locator('.extension-manager__section')
    await expect(sections).toHaveCount(2)
    await expect(sections.nth(0).locator('.tr-extension-card__name')).toHaveText(['Map service', 'Browser connector'])
    await expect(sections.nth(1).locator('.tr-extension-card__name')).toHaveText(['Train service', 'File connector'])

    await component.getByPlaceholder('请输入关键字搜索').fill('service')

    await expect(sections.nth(0).locator('.tr-extension-card__name')).toHaveText(['Map service'])
    await expect(sections.nth(1).locator('.tr-extension-card__name')).toHaveText(['Train service'])

    await component.getByPlaceholder('请输入关键字搜索').fill('')

    const availableCard = component.locator('.tr-extension-card').filter({ hasText: 'Train service' })
    await availableCard.getByRole('button', { name: '添加' }).click()

    await expect(component.getByTestId('event-log')).toHaveText('install:{"id":"train","kind":"mcp"}')
    await expect(component.getByTestId('catalog')).toHaveText(
      'Map service,Browser connector,Summary skill,Train service,File connector,Translate skill',
    )
  })
})
