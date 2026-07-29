import { expect, test } from '@playwright/experimental-ct-vue'
import UseAsChildFixture from './UseAsChild.fixture.vue'

test.describe('Extension internal useAsChild', () => {
  test('合并原节点和注入的 props、事件及 ref', async ({ mount }) => {
    const component = await mount(UseAsChildFixture, {
      props: { mode: 'valid' },
    })
    const trigger = component.getByTestId('as-child-trigger')

    await expect(trigger).toHaveAttribute('aria-label', 'Injected trigger')
    await expect(trigger).toHaveAttribute('data-original-ref', 'true')
    await expect(trigger).toHaveAttribute('data-injected-ref', 'true')

    await trigger.click()
    await expect(component.getByTestId('click-counts')).toHaveText('1/1')
  })

  test('展开 Fragment 并忽略 Comment 和空白 Text', async ({ mount }) => {
    const component = await mount(UseAsChildFixture, {
      props: { mode: 'fragment' },
    })

    await expect(component.getByTestId('as-child-trigger')).toHaveCount(1)
    await expect(component.getByTestId('as-child-trigger')).toHaveText('asChild trigger')
  })

  test('没有有效子节点时不渲染并报告数量', async ({ mount, page }) => {
    const warnings: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'warning') warnings.push(message.text())
    })

    const component = await mount(UseAsChildFixture, {
      props: {
        debugName: 'UseAsChildFixture',
        mode: 'empty',
      },
    })

    await expect(component.getByTestId('as-child-trigger')).toHaveCount(0)
    expect(
      warnings.some((message) =>
        message.includes('UseAsChildFixture with asChild expects exactly one child, but received 0.'),
      ),
    ).toBe(true)
  })

  test('存在多个有效子节点时不静默选取第一个节点', async ({ mount, page }) => {
    const warnings: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'warning') warnings.push(message.text())
    })

    const component = await mount(UseAsChildFixture, {
      props: {
        debugName: 'UseAsChildFixture',
        mode: 'multiple',
      },
    })

    await expect(component.locator('button')).toHaveCount(0)
    expect(
      warnings.some((message) =>
        message.includes('UseAsChildFixture with asChild expects exactly one child, but received 2.'),
      ),
    ).toBe(true)
  })

  test('非空 Text 节点不能作为 asChild 目标', async ({ mount, page }) => {
    const warnings: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'warning') warnings.push(message.text())
    })

    const component = await mount(UseAsChildFixture, {
      props: {
        debugName: 'UseAsChildFixture',
        mode: 'text',
      },
    })

    await expect(component).not.toContainText('text only')
    expect(
      warnings.some((message) =>
        message.includes('UseAsChildFixture with asChild received an unsupported child node.'),
      ),
    ).toBe(true)
  })

  test('Teleport 等特殊 VNode 不能作为 asChild 目标', async ({ mount, page }) => {
    const warnings: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'warning') warnings.push(message.text())
    })

    await mount(UseAsChildFixture, {
      props: {
        debugName: 'UseAsChildFixture',
        mode: 'teleport',
      },
    })

    await expect(page.getByText('teleported trigger')).toHaveCount(0)
    expect(
      warnings.some((message) =>
        message.includes('UseAsChildFixture with asChild received an unsupported child node.'),
      ),
    ).toBe(true)
  })

  test('省略 debugName 时使用通用警告前缀', async ({ mount, page }) => {
    const warnings: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'warning') warnings.push(message.text())
    })

    await mount(UseAsChildFixture, {
      props: { mode: 'empty' },
    })

    expect(
      warnings.some((message) => message.includes('[TinyRobot] asChild expects exactly one child, but received 0.')),
    ).toBe(true)
  })
})
