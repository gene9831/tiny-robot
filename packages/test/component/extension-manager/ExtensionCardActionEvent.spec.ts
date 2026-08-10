import { expect, test } from '@playwright/experimental-ct-vue'
import ExtensionCardActionEventFixture from './ExtensionCardActionEvent.fixture.vue'

test.describe('ExtensionCard action event', () => {
  test('uses checked for switch state and emits the resulting checked value by id', async ({ mount }) => {
    const component = await mount(ExtensionCardActionEventFixture)
    const toggle = component.getByRole('checkbox', { name: '扩展开关' })

    await expect(toggle).toBeChecked()
    await component.locator('.tr-extension-card-primary-actions__switch-track').click()
    await expect(toggle).not.toBeChecked()
    await expect(component.getByTestId('event-id')).toHaveText('toggle-extension')
    await expect(component.getByTestId('event-checked')).toHaveText('false')
  })

  test('emits install and button action ids without exposing presentation type', async ({ mount }) => {
    const component = await mount(ExtensionCardActionEventFixture)

    await component.getByRole('button', { name: '安装' }).click()
    await expect(component.getByTestId('event-id')).toHaveText('install-extension')

    await component.getByRole('button', { name: '配置' }).click()
    await expect(component.getByTestId('event-id')).toHaveText('configure-extension')
  })

  test('emits a custom action id with its payload', async ({ mount }) => {
    const component = await mount(ExtensionCardActionEventFixture)

    await component.getByRole('button', { name: '检查' }).click()
    await expect(component.getByTestId('event-id')).toHaveText('inspect-extension')
    await expect(component.getByTestId('event-payload')).toHaveText('{"source":"fixture"}')
  })

  test('emits a more action id', async ({ mount }) => {
    const component = await mount(ExtensionCardActionEventFixture)

    await component.getByRole('button', { name: '扩展操作菜单' }).click()
    await component.getByRole('button', { name: '删除' }).click()
    await expect(component.getByTestId('event-id')).toHaveText('delete-extension')
  })
})
