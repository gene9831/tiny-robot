import { expect, test } from '@playwright/experimental-ct-vue'
import ExtensionRootFixture from './ExtensionRoot.fixture.vue'

test.describe('Extension Root canonical context', () => {
  test('normalizes canonical inputs into installed and available projections', async ({ mount }) => {
    const component = await mount(ExtensionRootFixture)

    await expect(component.getByTestId('all-extensions')).toHaveText(
      'Map service,Summary skill,Plain installed service,Train service,Translate skill',
    )
    await expect(component.getByTestId('display-items')).toHaveText(
      'Map service,Summary skill,Plain installed service|Train service,Translate skill',
    )
    await expect(component.getByTestId('installed-items')).toHaveText(
      'Map service,Summary skill,Plain installed service',
    )
    await expect(component.getByTestId('available-items')).toHaveText('Train service,Translate skill')
    await expect(component.getByTestId('normalized-available-config')).toHaveText('absent')
    await expect(component.getByTestId('input-config-preserved')).toHaveText('true')
  })

  test('reacts to canonical input changes without a second catalog prop', async ({ mount }) => {
    const component = await mount(ExtensionRootFixture)

    await expect(component.getByTestId('available-items')).toHaveText('Train service,Translate skill')
    await component.getByTestId('replace-available-item').click()
    await expect(component.getByTestId('available-items')).toHaveText('Flight service,Translate skill')
  })

  test('passes controlled operation status through the canonical context', async ({ mount }) => {
    const component = await mount(ExtensionRootFixture)

    await expect(component.getByTestId('install-operation-status')).toHaveText('pending')
  })

  test('exposes the canonical public context without Filter state or writer capabilities', async ({ mount }) => {
    const component = await mount(ExtensionRootFixture)

    await expect(component.getByTestId('root-public-api')).toHaveText('available')
    await expect(component.getByTestId('root-active-kind-api')).toHaveText('private')
    await expect(component.getByTestId('root-internal-filter-writers')).toHaveText('private')
  })

  test('tracks installed and available section expansion independently', async ({ mount }) => {
    const component = await mount(ExtensionRootFixture)

    await expect(component.getByTestId('installed-section-expanded')).toHaveText('true')
    await expect(component.getByTestId('available-section-expanded')).toHaveText('true')
    await component.getByTestId('toggle-installed-section').click()
    await expect(component.getByTestId('installed-section-expanded')).toHaveText('false')
    await expect(component.getByTestId('available-section-expanded')).toHaveText('true')
    await component.getByTestId('toggle-available-section').click()
    await expect(component.getByTestId('available-section-expanded')).toHaveText('false')
    await expect(component.getByTestId('event-log')).toContainText(
      'expanded-sections:{"installed":false,"available":false}',
    )
  })

  test('synchronizes controlled canonical section state', async ({ mount }) => {
    const component = await mount(ExtensionRootFixture)

    await component.getByTestId('set-external-expanded-sections').click()
    await expect(component.getByTestId('installed-section-expanded')).toHaveText('false')
    await expect(component.getByTestId('available-section-expanded')).toHaveText('false')
  })

  test('emits immutable canonical intents only for valid operations', async ({ mount }) => {
    const component = await mount(ExtensionRootFixture)

    await component.getByTestId('request-install').click()
    await component.getByTestId('request-toggle').click()
    await component.getByTestId('request-toggle-without-enabled').click()
    await component.getByTestId('request-delete-available').click()
    await component.getByTestId('request-delete-installed').click()
    await component.getByTestId('request-detail').click()
    await component.getByTestId('request-create').click()

    await expect(component.getByTestId('event-log')).toContainText('install:{"id":"train","kind":"mcp"}')
    await expect(component.getByTestId('event-log')).toContainText('toggle:{"id":"map","kind":"mcp","enabled":false}')
    await expect(component.getByTestId('event-log')).toContainText('delete:{"id":"map","kind":"mcp"}')
    await expect(component.getByTestId('event-log')).toContainText('detail:{"id":"train","kind":"mcp"}')
    await expect(component.getByTestId('event-log')).toContainText('create:mcp')
    await expect(component.getByTestId('event-log')).not.toContainText('plain-installed')
    await expect(component.getByTestId('event-log')).not.toContainText('delete:{"id":"train"')
    await expect(component.getByTestId('all-extensions')).toHaveText(
      'Map service,Summary skill,Plain installed service,Train service,Translate skill',
    )
  })

  test('does not emit toggle intents with malformed boolean values', async ({ mount }) => {
    const component = await mount(ExtensionRootFixture)

    await component.getByTestId('request-malformed-toggle').click()
    await component.getByTestId('request-malformed-tool-toggle').click()

    await expect(component.getByTestId('event-log')).toHaveText('')
  })
})
