import { expect, test } from '@playwright/experimental-ct-vue'
import ExtensionListFixture from './ExtensionList.fixture.vue'

test.describe('ExtensionList composition', () => {
  test('renders consumer-provided item UI inside the responsive list', async ({ mount }) => {
    const component = await mount(ExtensionListFixture)

    await expect(component.getByTestId('consumer-item')).toHaveText(['First item', 'Second item'])
  })

  test('owns loading and empty presentation without prescribing item components', async ({ mount }) => {
    const component = await mount(ExtensionListFixture)

    await component.getByTestId('show-loading').click()
    await expect(component.getByText('加载中...')).toBeVisible()

    await component.getByTestId('show-empty').click()
    await expect(component.getByText('Nothing here')).toBeVisible()

    await component.getByTestId('show-content').click()
    await expect(component.getByTestId('consumer-item')).toHaveCount(2)
  })

  test('renders a standard error retry action and emits retry', async ({ mount }) => {
    const component = await mount(ExtensionListFixture)

    await component.getByTestId('show-error').click()
    await expect(component.getByText('Unable to load')).toBeVisible()
    await component.getByRole('button', { name: '重试' }).click()
    await expect(component.getByTestId('retry-count')).toHaveText('1')
  })
})
