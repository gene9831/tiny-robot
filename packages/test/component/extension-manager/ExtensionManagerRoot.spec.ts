import { expect, test } from '@playwright/experimental-ct-vue'
import ExtensionManagerRootFixture from './ExtensionManagerRoot.fixture.vue'

test.describe('ExtensionManagerRoot catalog composition', () => {
  test('keeps the complete installation-derived projection while active type remains controlled state', async ({ mount }) => {
    const component = await mount(ExtensionManagerRootFixture)

    await expect(component.getByTestId('active-type')).toHaveText('mcp')
    await expect(component.getByTestId('display-items')).toHaveText('Map service,Summary skill|Train service,Translate skill')
    await expect(component.getByTestId('installed-items')).toHaveText('Map service,Summary skill')
    await expect(component.getByTestId('market-items')).toHaveText('Train service,Translate skill')

    await component.getByTestId('show-skills').click()
    await expect(component.getByTestId('active-type')).toHaveText('skill')
    await expect(component.getByTestId('display-items')).toHaveText('Map service,Summary skill|Train service,Translate skill')
    await expect(component.getByTestId('installed-items')).toHaveText('Map service,Summary skill')
    await expect(component.getByTestId('market-items')).toHaveText('Train service,Translate skill')

    await expect(component.getByTestId('event-log')).toContainText('type:skill')
  })

  test('reacts to catalog changes without a second source prop', async ({ mount }) => {
    const component = await mount(ExtensionManagerRootFixture)

    await expect(component.getByTestId('market-items')).toHaveText('Train service,Translate skill')

    await component.getByTestId('replace-market-item').click()

    await expect(component.getByTestId('market-items')).toHaveText('Flight service,Translate skill')
  })

  test('passes external operation states through the root context', async ({ mount }) => {
    const component = await mount(ExtensionManagerRootFixture)

    await expect(component.getByTestId('install-operation-phase')).toHaveText('pending')
  })

  test('exposes public context behavior without Filter writer capabilities to template refs', async ({ mount }) => {
    const component = await mount(ExtensionManagerRootFixture)

    await expect(component.getByTestId('root-public-api')).toHaveText('available')
    await component.getByTestId('set-exposed-active-type').click()
    await expect(component.getByTestId('active-type')).toHaveText('skill')
    await expect(component.getByTestId('root-internal-filter-writers')).toHaveText('private')
  })

  test('tracks installed and market section expansion independently', async ({ mount }) => {
    const component = await mount(ExtensionManagerRootFixture)

    await expect(component.getByTestId('installed-section-expanded')).toHaveText('true')
    await expect(component.getByTestId('market-section-expanded')).toHaveText('true')

    await component.getByTestId('toggle-installed-section').click()
    await expect(component.getByTestId('installed-section-expanded')).toHaveText('false')
    await expect(component.getByTestId('market-section-expanded')).toHaveText('true')

    await component.getByTestId('toggle-market-section').click()
    await expect(component.getByTestId('market-section-expanded')).toHaveText('false')

    await expect(component.getByTestId('event-log')).toContainText(
      'expanded-sections:{"installed":false,"market":false}',
    )
  })

  test('synchronizes controlled active type and expanded sections with the root context', async ({ mount }) => {
    const component = await mount(ExtensionManagerRootFixture)

    await component.getByTestId('set-external-active-type').click()
    await expect(component.getByTestId('active-type')).toHaveText('skill')

    await component.getByTestId('show-mcp').click()
    await expect(component.getByTestId('event-log')).toContainText('active-type:mcp')

    await component.getByTestId('set-external-expanded-sections').click()
    await expect(component.getByTestId('installed-section-expanded')).toHaveText('false')
    await expect(component.getByTestId('market-section-expanded')).toHaveText('false')
  })

  test('emits stable identity intents without changing the catalog', async ({ mount }) => {
    const component = await mount(ExtensionManagerRootFixture)

    await component.getByTestId('request-add').click()
    await component.getByTestId('request-toggle').click()
    await component.getByTestId('request-delete').click()
    await component.getByTestId('request-detail-open').click()

    await expect(component.getByTestId('event-log')).toContainText(
      'add:{"id":"train","type":"mcp","source":"market"}',
    )
    await expect(component.getByTestId('event-log')).toContainText(
      'toggle:{"id":"map","type":"mcp","source":"installed","enabled":false}',
    )
    await expect(component.getByTestId('event-log')).toContainText(
      'delete:{"id":"map","type":"mcp","source":"installed"}',
    )
    await expect(component.getByTestId('event-log')).toContainText(
      'detail:{"id":"train","type":"mcp","source":"market"}',
    )
    await expect(component.getByTestId('installed-items')).toHaveText('Map service,Summary skill')
    await expect(component.getByTestId('market-items')).toHaveText('Train service,Translate skill')
  })
})
