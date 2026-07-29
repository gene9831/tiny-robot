import { expect, test } from '@playwright/experimental-ct-vue'
import ExtensionCardPopoverFixture from './ExtensionCardPopover.fixture.vue'

test.describe('ExtensionCardPopover asChild CT', () => {
  test('不向外部 trigger 注入内部样式类', async ({ mount }) => {
    const component = await mount(ExtensionCardPopoverFixture)

    await expect(component.getByTestId('native-trigger')).not.toHaveClass(/tr-extension-card-popover__trigger/)
  })

  test('原生元素作为唯一触发节点且能够打开浮层', async ({ mount }) => {
    const component = await mount(ExtensionCardPopoverFixture)
    const section = component.getByTestId('native-trigger-section')

    await expect(section.locator(':scope > [data-testid="native-trigger"]')).toHaveCount(1)
    await expect(section.locator(':scope > div.tr-extension-card-popover__trigger')).toHaveCount(0)

    await component.getByTestId('native-trigger').click()
    await expect(component.getByText('原生触发器内容')).toBeVisible()
  })

  test('单根 Vue 组件作为唯一触发节点且能够打开浮层', async ({ mount }) => {
    const component = await mount(ExtensionCardPopoverFixture)
    const section = component.getByTestId('component-trigger-section')

    await expect(section.locator(':scope > [data-testid="component-trigger"]')).toHaveCount(1)
    await expect(section.locator(':scope > div.tr-extension-card-popover__trigger')).toHaveCount(0)

    await component.getByTestId('component-trigger').click()
    await expect(component.getByText('组件触发器内容')).toBeVisible()
  })

  test('父组件替换 slot 函数时更新克隆的 trigger VNode', async ({ mount }) => {
    const component = await mount(ExtensionCardPopoverFixture)
    const trigger = component.getByTestId('replaced-slot-trigger')

    await expect(trigger).toHaveText('初始 slot')
    await component.getByTestId('replace-trigger-slot').click()
    await expect(trigger).toHaveText('替换 slot')
  })

  test('克隆 trigger ref 时具有合法的 Vue owner context', async ({ mount, page }) => {
    const warnings: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'warning') warnings.push(message.text())
    })

    const component = await mount(ExtensionCardPopoverFixture)
    await expect(component.getByTestId('native-trigger')).toBeVisible()

    expect(warnings.filter((message) => message.includes('Missing ref owner context'))).toEqual([])
  })
})
