import { expect, test } from '@playwright/experimental-ct-vue'
import ExtensionManagerFixture from './ExtensionManager.fixture.vue'

test.describe('ExtensionManager facade', () => {
  test('composes canonical sections without rendering private Cards or mutating the catalog', async ({ mount }) => {
    const component = await mount(ExtensionManagerFixture)

    const sections = component.locator('.extension-manager__section')
    await expect(sections).toHaveCount(2)
    await expect(sections.locator('.tr-extension-list')).toHaveCount(2)
    await expect(component.locator('.tr-extension-card')).toHaveCount(0)
    await expect(component.getByTestId('catalog')).toHaveText(
      'Map service,Browser connector,Summary skill,Train service,File connector,Translate skill',
    )
  })

  test('creates an extension using the Filter-owned active kind', async ({ mount }) => {
    const component = await mount(ExtensionManagerFixture)

    await component.getByLabel('Extension kind').selectOption('skill')
    await component.getByRole('button', { name: '添加自定义服务' }).click()

    await expect(component.getByTestId('event-log')).toHaveText('create:skill')
  })

  test('creates with the Filter-resolved first catalog kind when no kind is configured', async ({ mount }) => {
    const component = await mount(ExtensionManagerFixture, {
      props: {
        extensions: [
          { id: 'skill', kind: 'skill', name: 'Summary skill' },
          { id: 'mcp', kind: 'mcp', name: 'Map service' },
        ],
      },
    })

    await component.getByRole('button', { name: '添加自定义服务' }).click()

    await expect(component.getByTestId('event-log')).toHaveText('create:skill')
  })

  test('keeps controlled active kind through user selection and follows parent updates and catalog fallback', async ({
    mount,
  }) => {
    const component = await mount(ExtensionManagerFixture, { props: { activeKind: 'skill' } })
    const kindSelect = component.getByLabel('Extension kind')

    await expect(kindSelect).toHaveValue('skill')
    await kindSelect.selectOption('mcp')

    await component.getByRole('button', { name: '添加自定义服务' }).click()

    await expect(component.getByTestId('event-log')).toHaveText('create:skill')

    await component.update({ props: { activeKind: 'mcp' } })
    await expect(kindSelect).toHaveValue('mcp')

    await component.getByRole('button', { name: '添加自定义服务' }).click()
    await expect(component.getByTestId('event-log')).toHaveText('create:skill|create:mcp')

    await component.getByTestId('remove-mcp').click()
    await expect(kindSelect).toHaveValue('skill')

    await component.getByRole('button', { name: '添加自定义服务' }).click()
    await expect(component.getByTestId('event-log')).toHaveText('create:skill|create:mcp|create:skill')
  })

  test('uses the default active kind, then follows user selection and catalog fallback', async ({ mount }) => {
    const component = await mount(ExtensionManagerFixture, { props: { defaultActiveKind: 'skill' } })
    const kindSelect = component.getByLabel('Extension kind')

    await expect(kindSelect).toHaveValue('skill')
    await kindSelect.selectOption('mcp')
    await expect(kindSelect).toHaveValue('mcp')

    await component.getByRole('button', { name: '添加自定义服务' }).click()

    await expect(component.getByTestId('event-log')).toHaveText('create:mcp')

    await component.getByTestId('remove-mcp').click()
    await expect(kindSelect).toHaveValue('skill')

    await component.getByRole('button', { name: '添加自定义服务' }).click()
    await expect(component.getByTestId('event-log')).toHaveText('create:mcp|create:skill')
  })

  test('creates with the Filter fallback after the selected kind is removed', async ({ mount }) => {
    const component = await mount(ExtensionManagerFixture, { props: { activeKind: 'skill' } })

    await component.getByTestId('remove-skill').click()
    await component.getByRole('button', { name: '添加自定义服务' }).click()

    await expect(component.getByTestId('event-log')).toHaveText('create:mcp')
  })

  test('does not create when the Filter resolves no kind for an empty catalog', async ({ mount }) => {
    const component = await mount(ExtensionManagerFixture)
    const kindSelect = component.getByLabel('Extension kind')

    await kindSelect.selectOption('skill')
    await expect(kindSelect).toHaveValue('skill')

    await component.getByTestId('clear-catalog').click()
    await expect(kindSelect).toHaveValue('')
    await component.getByRole('button', { name: '添加自定义服务' }).click()

    await expect(component.getByTestId('event-log')).toHaveText('')
  })
})
