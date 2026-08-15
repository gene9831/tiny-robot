import { expect, test } from '@playwright/experimental-ct-vue'
import ExtensionManagerFixture from './ExtensionManager.fixture.vue'

test.describe('ExtensionManager foundation', () => {
  test('selects the first enabled tab by default', async ({ mount }) => {
    const component = await mount(ExtensionManagerFixture)

    await expect(component.getByRole('tab', { name: /Library/ })).toHaveAttribute('aria-selected', 'true')
    await expect(component.getByRole('tab', { name: /Marketplace/ })).toHaveAttribute('aria-selected', 'false')
    await expect(component.getByTestId('section-header-library-library-actions')).toBeVisible()
    await expect(component.getByTestId('section-header-library-library-state')).toHaveAttribute('aria-expanded', 'true')
  })

  test('honors default-active-tab and renders the selected tab sections', async ({ mount }) => {
    const component = await mount(ExtensionManagerFixture, { props: { defaultActiveTab: 'market' } })

    await expect(component.getByRole('tab', { name: /Marketplace/ })).toHaveAttribute('aria-selected', 'true')
    await expect(component.getByTestId('section-header-market-market-main')).toBeVisible()
    await expect(component.getByTestId('section-header-library-library-actions')).toHaveCount(0)
  })

  test('renders the top-level empty state when no enabled tab remains', async ({ mount }) => {
    const component = await mount(ExtensionManagerFixture)

    await component.getByTestId('disable-all-tabs').click()

    await expect(component.getByText('No enabled tabs', { exact: true })).toBeVisible()
    await expect(component.getByTestId('section-header-library-library-actions')).toHaveCount(0)
    await expect(component.getByTestId('section-header-market-market-main')).toHaveCount(0)
    await expect(component.getByTestId('active-tab-model')).toHaveText(/^$/)
    await expect(component.getByTestId('event-log')).toContainText('update:active-tab:undefined')
  })

  test('selects a tab by click and updates v-model:active-tab', async ({ mount }) => {
    const component = await mount(ExtensionManagerFixture)

    await component.getByTestId('tab-slot-market').click()

    await expect(component.getByTestId('active-tab-model')).toHaveText('market')
    await expect(component.getByRole('tab', { name: /Marketplace/ })).toHaveAttribute('aria-selected', 'true')
    await expect(component.getByTestId('event-log')).toContainText('tab-change:market')
    await expect(component.getByTestId('event-log')).toContainText('update:active-tab:market')
  })

  test('follows externally controlled active-tab updates', async ({ mount }) => {
    const component = await mount(ExtensionManagerFixture)

    await component.getByTestId('set-external-active-tab').click()

    await expect(component.getByTestId('active-tab-model')).toHaveText('market')
    await expect(component.getByRole('tab', { name: /Marketplace/ })).toHaveAttribute('aria-selected', 'true')
    await expect(component.getByTestId('section-header-market-market-main')).toBeVisible()
  })

  test('applies Manager-level defaultExpanded when a section has no local default', async ({ mount }) => {
    const component = await mount(ExtensionManagerFixture, { props: { defaultExpanded: false } })

    await expect(component.getByTestId('section-header-library-library-actions')).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    await expect(component.getByTestId('section-header-library-library-empty')).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    await expect(component.getByTestId('section-header-library-library-state')).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  test('excludes disabled tabs and supports Enter, Space, ArrowLeft, ArrowRight, Home, and End selection', async ({
    mount,
  }) => {
    const component = await mount(ExtensionManagerFixture)
    const libraryTab = component.getByRole('tab', { name: /Library/ })
    const marketTab = component.getByRole('tab', { name: /Marketplace/ })

    await component.getByTestId('disable-market-tab').click()
    await expect(marketTab).toHaveAttribute('aria-disabled', 'true')

    await marketTab.dispatchEvent('click')
    await expect(component.getByTestId('active-tab-model')).toHaveText('library')
    await expect(libraryTab).toHaveAttribute('aria-selected', 'true')
    await expect(component.getByTestId('event-log')).not.toContainText('tab-change:market')

    await component.getByTestId('set-active-library').click()
    await libraryTab.focus()
    await libraryTab.press('ArrowRight')
    await expect(component.getByTestId('active-tab-model')).toHaveText('library')

    await component.getByTestId('enable-market-tab').click()

    await component.getByTestId('set-active-library').click()
    await marketTab.focus()
    await marketTab.press('Enter')
    await expect(component.getByTestId('active-tab-model')).toHaveText('market')

    await component.getByTestId('set-active-library').click()
    await marketTab.focus()
    await marketTab.press(' ')
    await expect(component.getByTestId('active-tab-model')).toHaveText('market')

    await component.getByTestId('disable-market-tab').click()
    await expect(marketTab).toHaveAttribute('aria-disabled', 'true')
    await expect(component.getByTestId('active-tab-model')).toHaveText('library')
    await expect(libraryTab).toHaveAttribute('aria-selected', 'true')

    await component.getByTestId('enable-market-tab').click()

    await component.getByTestId('set-active-library').click()
    await libraryTab.focus()
    await libraryTab.press('ArrowRight')
    await expect(component.getByTestId('active-tab-model')).toHaveText('market')

    await marketTab.focus()
    await marketTab.press('ArrowLeft')
    await expect(component.getByTestId('active-tab-model')).toHaveText('library')

    await marketTab.focus()
    await marketTab.press('End')
    await expect(component.getByTestId('active-tab-model')).toHaveText('market')

    await libraryTab.focus()
    await libraryTab.press('Home')
    await expect(component.getByTestId('active-tab-model')).toHaveText('library')
  })

  test('falls back to the first enabled tab when the active tab is removed', async ({ mount }) => {
    const component = await mount(ExtensionManagerFixture, { props: { defaultActiveTab: 'market' } })

    await expect(component.getByRole('tab', { name: /Marketplace/ })).toHaveAttribute('aria-selected', 'true')
    await component.getByTestId('remove-active-tab').click()

    await expect(component.getByRole('tab', { name: /Library/ })).toHaveAttribute('aria-selected', 'true')
    await expect(component.getByTestId('active-tab-model')).toHaveText('library')
    await expect(component.getByTestId('event-log')).toContainText('update:active-tab:library')
  })

  test('renders multiple sections only for the active tab and exposes tab slot content', async ({ mount }) => {
    const component = await mount(ExtensionManagerFixture)

    await expect(component.locator('[data-testid^="section-header-library-"]')).toHaveCount(3)
    await expect(component.locator('[data-testid^="section-header-market-"]')).toHaveCount(0)
    await expect(component.getByTestId('tab-slot-library')).toContainText('selected')

    await component.getByTestId('tab-slot-market').click()

    await expect(component.locator('[data-testid^="section-header-library-"]')).toHaveCount(0)
    await expect(component.locator('[data-testid^="section-header-market-"]')).toHaveCount(4)
    await expect(component.getByTestId('tab-slot-market')).toContainText('selected')
  })

  test('keeps sections independently collapsible with default, controlled, and stable state', async ({ mount }) => {
    const component = await mount(ExtensionManagerFixture)
    const actionHeader = component.getByTestId('section-header-library-library-actions')
    const emptyHeader = component.getByTestId('section-header-library-library-empty')

    await expect(actionHeader).toHaveAttribute('aria-expanded', 'true')
    await expect(emptyHeader).toHaveAttribute('aria-expanded', 'false')

    await actionHeader.click()
    await emptyHeader.click()

    await expect(actionHeader).toHaveAttribute('aria-expanded', 'false')
    await expect(emptyHeader).toHaveAttribute('aria-expanded', 'true')
    await expect(component.getByTestId('empty-slot-library-library-empty')).toBeVisible()
    await expect(component.getByTestId('expanded-sections-model')).toContainText('"library-actions":false')
    await expect(component.getByTestId('expanded-sections-model')).toContainText('"library-empty":true')
    await expect(component.getByTestId('event-log')).toContainText('section-toggle:library/library-actions/false')
    await expect(component.getByTestId('event-log')).toContainText('section-toggle:library/library-empty/true')
    await expect(component.getByTestId('event-log')).toContainText('update:expanded-sections:')

    await component.getByTestId('tab-slot-market').click()
    await component.getByTestId('tab-slot-library').click()
    await expect(actionHeader).toHaveAttribute('aria-expanded', 'false')
    await expect(emptyHeader).toHaveAttribute('aria-expanded', 'true')

    await component.getByTestId('set-external-expanded-sections').click()
    await expect(actionHeader).toHaveAttribute('aria-expanded', 'true')
    await expect(emptyHeader).toHaveAttribute('aria-expanded', 'false')
    const externallyControlledExpandedSections = {
      'library-actions': true,
      'library-empty': false,
      'library-state': true,
      'market-main': true,
    }
    await expect(component.getByTestId('expanded-sections-model')).toHaveText(
      JSON.stringify(externallyControlledExpandedSections),
    )

    await actionHeader.click()
    await expect(component.getByTestId('expanded-sections-model')).toHaveText(
      JSON.stringify({
        'library-actions': false,
        'library-empty': false,
        'library-state': true,
        'market-main': true,
      }),
    )
  })

  test('applies section state precedence in loading, error, items, and empty order', async ({ mount }) => {
    const component = await mount(ExtensionManagerFixture)
    const loadingSlot = component.getByTestId('loading-slot-library-library-state')
    const errorSlot = component.getByTestId('error-slot-library-library-state')
    const stateItem = component.locator('li[data-card-id="state-item"]')
    const emptySlot = component.getByTestId('empty-slot-library-library-state')

    await expect(loadingSlot).toBeVisible()
    await expect(errorSlot).toHaveCount(0)
    await expect(stateItem).toHaveCount(0)
    await expect(emptySlot).toHaveCount(0)

    await component.getByTestId('set-state-error').click()
    await expect(errorSlot).toBeVisible()
    await expect(loadingSlot).toHaveCount(0)
    await expect(stateItem).toHaveCount(0)
    await expect(emptySlot).toHaveCount(0)

    await component.getByTestId('set-state-items').click()
    await expect(stateItem).toHaveCount(1)
    await expect(loadingSlot).toHaveCount(0)
    await expect(errorSlot).toHaveCount(0)
    await expect(emptySlot).toHaveCount(0)

    await component.getByTestId('set-state-empty').click()
    await expect(emptySlot).toBeVisible()
    await expect(stateItem).toHaveCount(0)
    await expect(loadingSlot).toHaveCount(0)
    await expect(errorSlot).toHaveCount(0)
  })

  test('routes an error retry slot click with tab and section context', async ({ mount }) => {
    const component = await mount(ExtensionManagerFixture)

    await component.getByTestId('set-state-error').click()
    await component.getByTestId('retry-library-library-state').click()

    await expect(component.getByTestId('event-log')).toContainText('retry:library/library-state')
  })

  test('wraps real Card action and name-click events with tab, section, and item identity', async ({ mount }) => {
    const component = await mount(ExtensionManagerFixture)
    const item = component.locator('li[data-card-id="alpha"]')

    await item.getByRole('checkbox', { name: 'Enable Alpha' }).uncheck({ force: true })
    await item.getByRole('button', { name: 'Inspect Alpha', exact: true }).click()
    await item.getByRole('button', { name: 'Alpha extension', exact: true }).click()

    await expect(component.getByTestId('event-log')).toContainText(
      'action:{"tabId":"library","sectionId":"library-actions","itemId":"alpha","action":{"id":"toggle-alpha","type":"switch","checked":false}}',
    )
    await expect(component.getByTestId('event-log')).toContainText(
      'action:{"tabId":"library","sectionId":"library-actions","itemId":"alpha","action":{"id":"inspect-alpha","type":"button"}}',
    )
    await expect(component.getByTestId('event-log')).toContainText(
      'name-click:{"tabId":"library","sectionId":"library-actions","itemId":"alpha","event":{"type":"click"}}',
    )
  })

  test('renders custom item content while preserving Manager-owned CardGrid identity', async ({ mount }) => {
    const component = await mount(ExtensionManagerFixture)

    await component.getByTestId('show-custom-item-manager').click()

    const customManager = component.getByTestId('custom-manager')
    const customItem = customManager.locator('li[data-card-id="custom-alpha"]')
    await expect(customItem).toHaveCount(1)
    await expect(customItem).toHaveAttribute('data-card-id', 'custom-alpha')
    await expect(customItem.getByTestId('custom-rendered-custom-alpha')).toContainText('Custom item: Custom Alpha')
    await expect(customItem.getByTestId('custom-slot-context')).toHaveText('custom/custom-section/custom-alpha/0')
    await expect(customItem.getByTestId('custom-rendered-custom-alpha')).toHaveAttribute(
      'data-slot-context',
      JSON.stringify({
        tabId: 'custom',
        tabLabel: 'Custom content',
        sectionId: 'custom-section',
        sectionTitle: 'Custom items',
        itemId: 'custom-alpha',
        itemName: 'Custom Alpha',
        itemDescription: 'Custom description',
        index: 0,
      }),
    )
  })

  test('emits header action and close output', async ({ mount }) => {
    const component = await mount(ExtensionManagerFixture)

    await component.getByTestId('header-action').click()
    await expect(component.getByTestId('header-action-count')).toHaveText('1')

    const closeButton = component.getByTestId('manager-host').getByRole('button', { name: /close|关闭/i })
    await expect(closeButton).toHaveCount(1)
    await closeButton.click()
    await expect(component.getByTestId('event-log')).toContainText('close')
  })

  test('does not mutate source tab data after selection, collapse, and event routing', async ({ mount }) => {
    const component = await mount(ExtensionManagerFixture)
    const sourceBefore = (await component.getByTestId('source-snapshot').textContent()) ?? ''

    await component.getByTestId('set-active-market').click()
    await component.getByTestId('set-active-library').click()

    const item = component.locator('li[data-card-id="alpha"]')
    await item.getByRole('checkbox', { name: 'Enable Alpha' }).uncheck({ force: true })
    await item.getByRole('button', { name: 'Alpha extension', exact: true }).click()
    await component.getByTestId('section-header-library-library-actions').click()

    await expect(component.getByTestId('source-snapshot')).toHaveText(sourceBefore)
    await expect(component.getByTestId('event-log')).toContainText('action:')
    await expect(component.getByTestId('event-log')).toContainText('name-click:')
  })
})
