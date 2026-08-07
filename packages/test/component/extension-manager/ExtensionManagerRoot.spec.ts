import { expect, test } from '@playwright/experimental-ct-vue'
import ExtensionManagerRootFixture from './ExtensionManagerRoot.fixture.vue'

test.describe('ExtensionManagerRoot catalog composition', () => {
  test('derives installed and market projections from the canonical catalog', async ({ mount }) => {
    const component = await mount(ExtensionManagerRootFixture)

    await expect(component.getByTestId('active-type')).toHaveText('mcp')
    await expect(component.getByTestId('installed-items')).toHaveText('Map service')
    await expect(component.getByTestId('market-items')).toHaveText('Train service')

    await component.getByTestId('show-skills').click()
    await expect(component.getByTestId('active-type')).toHaveText('skill')
    await expect(component.getByTestId('installed-items')).toHaveText('Summary skill')
    await expect(component.getByTestId('market-items')).toHaveText('Translate skill')

    await expect(component.getByTestId('event-log')).toHaveText('type:skill')
  })

  test('reacts to catalog changes without a second source prop', async ({ mount }) => {
    const component = await mount(ExtensionManagerRootFixture)

    await expect(component.getByTestId('market-items')).toHaveText('Train service')

    await component.getByTestId('replace-market-item').click()

    await expect(component.getByTestId('market-items')).toHaveText('Flight service')
  })

  test('passes external operation states through the root context', async ({ mount }) => {
    const component = await mount(ExtensionManagerRootFixture)

    await expect(component.getByTestId('install-operation-phase')).toHaveText('pending')
  })
})
