import { expect, test } from '@playwright/experimental-ct-vue'
import ExtensionManagerFixture from './ExtensionManager.fixture.vue'
import ExtensionManagerUncontrolledFixture from './ExtensionManagerUncontrolled.fixture.vue'

test.describe('ExtensionManager section model', () => {
  test('derives stable installed and available sections from the active tab items', async ({ mount }) => {
    const component = await mount(ExtensionManagerFixture)
    const manager = component.getByTestId('manager-host')

    await expect(manager.locator('[data-section-key="installed"]')).toHaveCount(1)
    await expect(manager.locator('[data-section-key="available"]')).toHaveCount(1)
    await expect(manager.getByTestId('section-header-library-installed')).toHaveText('已安装 (1)')
    await expect(manager.getByTestId('section-header-library-available')).toHaveText('可安装 (2)')

    const installedIds = await manager
      .locator('[data-section-key="installed"] li[data-card-id]')
      .evaluateAll((elements) => elements.map((element) => element.getAttribute('data-card-id')))
    const availableIds = await manager
      .locator('[data-section-key="available"] li[data-card-id]')
      .evaluateAll((elements) => elements.map((element) => element.getAttribute('data-card-id')))

    expect(installedIds).toEqual(['alpha'])
    expect(availableIds).toEqual(['beta', 'gamma'])
  })

  test('keeps both sections visible and renders the empty slot for an empty derived section', async ({ mount }) => {
    const component = await mount(ExtensionManagerFixture)

    await component.getByTestId('set-active-market').click()

    const manager = component.getByTestId('manager-host')
    await expect(manager.getByTestId('section-header-market-installed')).toHaveText('已安装 (1)')
    await expect(manager.getByTestId('section-header-market-available')).toHaveText('可安装 (0)')
    await expect(manager.getByTestId('empty-slot-market-available')).toHaveText('Empty available')
  })

  test('moves an item between derived sections when installed changes', async ({ mount }) => {
    const component = await mount(ExtensionManagerFixture)
    const manager = component.getByTestId('manager-host')

    await component.getByTestId('install-beta').click()

    await expect(manager.locator('[data-section-key="installed"] li[data-card-id="beta"]')).toHaveCount(1)
    await expect(manager.locator('[data-section-key="available"] li[data-card-id="beta"]')).toHaveCount(0)
    await expect(manager.getByTestId('section-header-library-installed')).toHaveText('已安装 (2)')
    await expect(manager.getByTestId('section-header-library-available')).toHaveText('可安装 (1)')
  })

  test('uses section header and empty slot context without exposing section configuration props', async ({ mount }) => {
    const component = await mount(ExtensionManagerFixture)
    const manager = component.getByTestId('manager-host')

    await expect(manager.getByTestId('section-header-context-library-installed')).toHaveText(
      'library/installed/已安装/1',
    )
    await expect(manager.getByTestId('section-header-context-library-available')).toHaveText(
      'library/available/可安装/2',
    )

    await component.getByTestId('set-active-market').click()
    await expect(manager.getByTestId('empty-slot-context-market-available')).toHaveText('market/available/可安装')
  })

  test('keeps installed metadata out of the Card/Grid item boundary', async ({ mount }) => {
    const component = await mount(ExtensionManagerFixture)

    await component.getByTestId('show-item-slot-manager').click()

    const itemSlotManager = component.getByTestId('item-slot-manager')
    await expect(itemSlotManager.locator('.extension-manager__header')).toHaveCount(0)

    const itemSlot = itemSlotManager.getByTestId('item-slot-context')
    await expect(itemSlot).toHaveCount(3)
    expect(await itemSlot.allTextContents()).toEqual(['false', 'false', 'false'])
  })

  test('preserves collapse state per tab and section key', async ({ mount }) => {
    const component = await mount(ExtensionManagerFixture)
    const manager = component.getByTestId('manager-host')
    const libraryInstalled = manager.getByTestId('section-header-library-installed')
    const libraryAvailable = manager.getByTestId('section-header-library-available')

    await libraryInstalled.click()
    await expect(libraryInstalled).toHaveAttribute('aria-expanded', 'false')
    await expect(libraryAvailable).toHaveAttribute('aria-expanded', 'true')

    await component.getByTestId('set-active-market').click()
    const marketInstalled = manager.getByTestId('section-header-market-installed')
    await expect(marketInstalled).toHaveAttribute('aria-expanded', 'true')

    await marketInstalled.click()
    await component.getByTestId('set-active-library').click()
    await expect(manager.getByTestId('section-header-library-installed')).toHaveAttribute('aria-expanded', 'false')
    await expect(manager.getByTestId('section-header-market-installed')).toHaveCount(0)
  })

  test('routes Card action and name-click events with section keys', async ({ mount }) => {
    const component = await mount(ExtensionManagerFixture)
    const item = component.getByTestId('manager-host').locator('li[data-card-id="alpha"]')

    await item.getByRole('checkbox', { name: 'Enable Alpha' }).uncheck({ force: true })
    await item.getByRole('button', { name: 'Alpha extension', exact: true }).click()

    await expect(component.getByTestId('event-log')).toContainText(
      'action:{"tabId":"library","sectionKey":"installed","itemId":"alpha","action":{"id":"toggle-alpha","type":"switch","checked":false}}',
    )
    await expect(component.getByTestId('event-log')).toContainText(
      'name-click:{"tabId":"library","sectionKey":"installed","itemId":"alpha","event":{"type":"click"}}',
    )
  })
})

test.describe('ExtensionManager uncontrolled state', () => {
  test('uses internal active and section expansion state without v-model bindings', async ({ mount }) => {
    const component = await mount(ExtensionManagerUncontrolledFixture)
    const manager = component.getByTestId('uncontrolled-manager')
    const dashTab = manager.getByRole('tab', { name: /Dash tab/ })
    const slashTab = manager.getByRole('tab', { name: /Slash tab/ })
    const dashSection = manager.getByTestId('uncontrolled-section-header-a-b-installed')

    await expect(dashTab).toHaveAttribute('aria-selected', 'true')
    await expect(dashSection).toHaveAttribute('aria-expanded', 'true')

    await dashSection.click()

    await expect(dashSection).toHaveAttribute('aria-expanded', 'false')
    await expect(component.getByTestId('uncontrolled-event-log')).toContainText('section-toggle:a-b/installed/false')

    await component.getByTestId('disable-default-tab').click()

    await expect(slashTab).toHaveAttribute('aria-selected', 'true')
    await expect(dashTab).toHaveAttribute('aria-disabled', 'true')
    await expect(component.getByTestId('uncontrolled-event-log')).toContainText('update:active-tab:a/b')
  })

  test('keeps arbitrary tab ids safe in the nested expansion model', async ({ mount }) => {
    const component = await mount(ExtensionManagerUncontrolledFixture)
    const manager = component.getByTestId('identity-manager')
    const slashSection = manager.getByTestId('identity-section-header-a/b-installed')

    await expect(slashSection).toHaveAttribute('aria-expanded', 'true')
    await slashSection.click()
    await expect(slashSection).toHaveAttribute('aria-expanded', 'false')

    await manager.getByRole('tab', { name: /Dash identity tab/ }).click()

    await expect(manager.getByTestId('identity-section-header-a-b-installed')).toHaveAttribute('aria-expanded', 'true')
  })
})
