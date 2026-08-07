import { expect, test } from '@playwright/experimental-ct-vue'
import ExtensionFilterFixture from './ExtensionFilter.fixture.vue'

test.describe('ExtensionManager.Filter', () => {
  test('exposes the complete installation-derived projection while no Filter is mounted', async ({ mount }) => {
    const component = await mount(ExtensionFilterFixture)

    await expect(component.getByTestId('display-installed')).toHaveText('Map service,Summary skill')
    await expect(component.getByTestId('display-market')).toHaveText('Train service,Translate skill,Research skill')
  })

  test('collects unique tag options from the complete catalog', async ({ mount }) => {
    const component = await mount(ExtensionFilterFixture)
    await component.getByTestId('toggle-filter').click()

    await expect(component.getByRole('combobox').locator('option')).toHaveText([
      '全部标签',
      'travel',
      'maps',
      'writing',
      'recommended',
      'search',
    ])
  })

  test('filters installed and market items by the selected tag', async ({ mount }) => {
    const component = await mount(ExtensionFilterFixture)
    await component.getByTestId('toggle-filter').click()

    await component.getByRole('combobox').selectOption('travel')

    await expect(component.getByTestId('display-installed')).toHaveText('Map service')
    await expect(component.getByTestId('display-market')).toHaveText('Train service')
    await expect(component.getByTestId('event-log')).toContainText('tag:travel')
  })

  test('filters installed and market items by the query', async ({ mount }) => {
    const component = await mount(ExtensionFilterFixture)
    await component.getByTestId('toggle-filter').click()

    await component.getByRole('textbox').fill('service')

    await expect(component.getByTestId('display-installed')).toHaveText('Map service')
    await expect(component.getByTestId('display-market')).toHaveText('Train service')
    await expect(component.getByTestId('event-log')).toContainText('query:service')
  })

  test('clears controlled query and tag models when the active type changes', async ({ mount }) => {
    const component = await mount(ExtensionFilterFixture)
    await component.getByTestId('toggle-filter').click()

    await component.getByRole('textbox').fill('service')
    await component.getByRole('combobox').selectOption('travel')
    await component.getByTestId('show-skills').click()

    await expect(component.getByRole('textbox')).toHaveValue('')
    await expect(component.getByRole('combobox')).toHaveValue('')
    await expect(component.getByTestId('display-installed')).toHaveText('Summary skill')
    await expect(component.getByTestId('display-market')).toHaveText('Translate skill,Research skill')
  })

  test('restores the unfiltered projection when its Filter lease is released', async ({ mount }) => {
    const component = await mount(ExtensionFilterFixture)
    await component.getByTestId('toggle-filter').click()
    await component.getByRole('textbox').fill('train')

    await expect(component.getByTestId('display-installed')).toBeEmpty()
    await expect(component.getByTestId('display-market')).toHaveText('Train service')

    await component.getByTestId('toggle-filter').click()

    await expect(component.getByTestId('display-installed')).toHaveText('Map service,Summary skill')
    await expect(component.getByTestId('display-market')).toHaveText('Train service,Translate skill,Research skill')
  })

  test('reports a duplicate Filter in development without replacing the first projection', async ({ mount, page }) => {
    const component = await mount(ExtensionFilterFixture)
    await component.getByTestId('toggle-filter').click()
    await component.getByRole('textbox').fill('train')

    await expect(component.getByTestId('display-market')).toHaveText('Train service')

    const duplicateFilterErrors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error' && message.text().includes('Only one ExtensionFilter')) {
        duplicateFilterErrors.push(message.text())
      }
    })

    await component.getByTestId('toggle-second-filter').click()

    await expect.poll(() => duplicateFilterErrors).toHaveLength(1)
    await expect(component.getByTestId('display-installed')).toBeEmpty()
    await expect(component.getByTestId('display-market')).toHaveText('Train service')
  })
})
