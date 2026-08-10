import { expect, test } from '@playwright/experimental-ct-vue'
import ExtensionFilterFixture from './ExtensionFilter.fixture.vue'

test.describe('ExtensionManager.Filter', () => {
  test('exposes the complete canonical projection while no Filter is mounted', async ({ mount }) => {
    const component = await mount(ExtensionFilterFixture)

    await expect(component.getByTestId('display-installed')).toHaveText('Map service,Summary skill')
    await expect(component.getByTestId('display-available')).toHaveText(
      'Train service,Translate skill,Workflow builder',
    )
  })

  test('collects kind options in first-seen catalog order and uses their display labels', async ({ mount }) => {
    const component = await mount(ExtensionFilterFixture)
    await component.getByTestId('toggle-filter').click()

    await expect(component.getByLabel('Extension kind').locator('option')).toHaveText([
      'MCP servers',
      'Skills',
      'Workflows',
    ])
  })

  test('collects tag options from the complete catalog in first-seen order', async ({ mount }) => {
    const component = await mount(ExtensionFilterFixture)
    await component.getByTestId('toggle-filter').click()

    await expect(component.getByLabel('全部标签').locator('option')).toHaveText([
      '全部标签',
      'travel',
      'maps',
      'writing',
      'recommended',
    ])
  })

  test('uses a requested active kind', async ({ mount }) => {
    const requested = await mount(ExtensionFilterFixture, { props: { activeKind: 'mcp' } })
    await requested.getByTestId('toggle-filter').click()
    await expect(requested.getByLabel('Extension kind')).toHaveValue('mcp')
  })

  test('uses a requested default active kind', async ({ mount }) => {
    const defaulted = await mount(ExtensionFilterFixture, { props: { defaultActiveKind: 'skill' } })
    await defaulted.getByTestId('toggle-filter').click()
    await expect(defaulted.getByLabel('Extension kind')).toHaveValue('skill')
  })

  test('falls back to the first kind when the requested default is unavailable', async ({ mount }) => {
    const fallback = await mount(ExtensionFilterFixture, { props: { defaultActiveKind: 'missing' } })
    await fallback.getByTestId('toggle-filter').click()
    await expect(fallback.getByLabel('Extension kind')).toHaveValue('mcp')
  })

  test('falls back when the selected kind is removed and clears selection for an empty catalog', async ({ mount }) => {
    const component = await mount(ExtensionFilterFixture)
    await component.getByTestId('toggle-filter').click()
    await expect(component.getByLabel('Extension kind')).toHaveValue('skill')

    await component.getByTestId('remove-skills').click()
    await expect(component.getByLabel('Extension kind')).toHaveValue('mcp')
    await expect(component.getByTestId('display-installed')).toHaveText('Map service')
    await expect(component.getByTestId('display-available')).toHaveText('Train service')

    await component.getByTestId('empty-catalog').click()
    await expect(component.getByLabel('Extension kind')).toHaveValue('')
    await expect(component.getByTestId('display-installed')).toBeEmpty()
    await expect(component.getByTestId('display-available')).toBeEmpty()
  })

  test('filters the complete catalog by kind, tag, and query before partitioning it', async ({ mount }) => {
    const component = await mount(ExtensionFilterFixture)
    await component.getByTestId('toggle-filter').click()

    await component.getByLabel('Extension kind').selectOption('mcp')
    await component.getByLabel('全部标签').selectOption('travel')

    await expect(component.getByTestId('display-installed')).toHaveText('Map service')
    await expect(component.getByTestId('display-available')).toHaveText('Train service')

    await component.getByRole('textbox').fill('train')
    await expect(component.getByTestId('display-installed')).toBeEmpty()
    await expect(component.getByTestId('display-available')).toHaveText('Train service')
  })

  test('emits optional v-model updates while retaining Filter-owned defaults', async ({ mount }) => {
    const component = await mount(ExtensionFilterFixture)
    await component.getByTestId('toggle-filter').click()

    await component.getByLabel('Extension kind').selectOption('mcp')
    await component.getByLabel('全部标签').selectOption('travel')
    await component.getByRole('textbox').fill('map')

    await expect(component.getByTestId('event-log')).toContainText('update:active-kind:mcp')
    await expect(component.getByTestId('event-log')).toContainText('update:tag:travel')
    await expect(component.getByTestId('event-log')).toContainText('update:query:map')
    await expect(component.getByTestId('display-installed')).toHaveText('Map service')
  })

  test('restores the unfiltered projection when its Filter lease is released', async ({ mount }) => {
    const component = await mount(ExtensionFilterFixture)
    await component.getByTestId('toggle-filter').click()
    await component.getByLabel('Extension kind').selectOption('mcp')
    await component.getByRole('textbox').fill('train')

    await expect(component.getByTestId('display-installed')).toBeEmpty()
    await expect(component.getByTestId('display-available')).toHaveText('Train service')

    await component.getByTestId('toggle-filter').click()

    await expect(component.getByTestId('display-installed')).toHaveText('Map service,Summary skill')
    await expect(component.getByTestId('display-available')).toHaveText(
      'Train service,Translate skill,Workflow builder',
    )
  })

  test('reports a duplicate Filter in development without replacing the first projection', async ({ mount, page }) => {
    const component = await mount(ExtensionFilterFixture)
    await expect(component.getByTestId('is-development')).toHaveText('true')
    await component.getByTestId('toggle-filter').click()
    await component.getByLabel('Extension kind').selectOption('mcp')
    await component.getByRole('textbox').fill('train')

    await expect(component.getByTestId('display-available')).toHaveText('Train service')

    const duplicateFilterErrors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error' && message.text().includes('Only one ExtensionFilter')) {
        duplicateFilterErrors.push(message.text())
      }
    })

    await component.getByTestId('toggle-second-filter').click()

    await expect.poll(() => duplicateFilterErrors).toHaveLength(1)
    await expect(component.getByTestId('display-installed')).toBeEmpty()
    await expect(component.getByTestId('display-available')).toHaveText('Train service')
  })
})
