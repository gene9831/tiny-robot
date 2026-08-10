import { expect, test } from '@playwright/experimental-ct-vue'
import ExtensionListDefaultActionsFixture from './ExtensionListDefaultActions.fixture.vue'

test.describe('ExtensionList default card actions', () => {
  test('provides installed actions from the matching item', async ({ mount }) => {
    const component = await mount(ExtensionListDefaultActionsFixture)
    const card = component.getByTestId('installed-card')

    await expect(card.getByRole('checkbox', { name: '停用扩展' })).toBeChecked()
    await card.getByRole('button', { name: '更多操作' }).click()
    await expect(card.getByRole('button', { name: '删除' })).toBeVisible()
  })

  test('projects the available install operation state onto the matching card', async ({ mount }) => {
    const component = await mount(ExtensionListDefaultActionsFixture)

    await expect(component.getByTestId('available-card').getByRole('button', { name: '重试' })).toBeVisible()
  })

  test('maps install statuses to stable action labels and disabled states', async ({ mount }) => {
    const component = await mount(ExtensionListDefaultActionsFixture)

    await expect(component.getByTestId('idle-available-card').getByRole('button', { name: '安装' })).toBeEnabled()
    await expect(component.getByTestId('pending-available-card').getByRole('button', { name: '安装中' })).toBeDisabled()
    await expect(
      component.getByTestId('successful-available-card').getByRole('button', { name: '已安装' }),
    ).toBeDisabled()
  })

  test('projects root operation state without mutating available items or the status map', async ({ mount }) => {
    const component = await mount(ExtensionListDefaultActionsFixture)

    await expect(
      component.getByTestId('pending-available-card').locator('.tr-extension-card__progress-bar'),
    ).toHaveAttribute('style', /width: 50%/)
    await expect(component.getByTestId('available-input-state')).toHaveText(
      '{"availableInstalled":false,"pendingInstalled":false}',
    )
    await expect(component.getByTestId('operation-state')).toHaveText('pending')
  })

  test('provides delete but no toggle for a passive installed extension', async ({ mount }) => {
    const component = await mount(ExtensionListDefaultActionsFixture)
    const card = component.getByTestId('passive-installed-card')

    await expect(card.getByRole('checkbox')).toHaveCount(0)
    await card.getByRole('button', { name: '更多操作' }).click()
    await expect(card.getByRole('button', { name: '删除' })).toBeVisible()
  })

  test('uses the canonical item id to find installed defaults', async ({ mount }) => {
    const component = await mount(ExtensionListDefaultActionsFixture)

    await expect(component.getByTestId('installed-card').getByRole('checkbox', { name: '停用扩展' })).toBeChecked()
  })

  test('gives available items install without delete or toggle actions', async ({ mount }) => {
    const component = await mount(ExtensionListDefaultActionsFixture)
    const card = component.getByTestId('available-installed-card')

    await expect(card.getByRole('button', { name: '安装' })).toBeVisible()
    await expect(card.getByRole('checkbox')).toHaveCount(0)
    await expect(card.getByRole('button', { name: '更多操作' })).toHaveCount(0)
  })

  test('gives explicitly supplied action arrays priority over list defaults', async ({ mount }) => {
    const component = await mount(ExtensionListDefaultActionsFixture)
    const card = component.getByTestId('override-card')

    await expect(card.getByRole('button', { name: '配置' })).toBeVisible()
    await expect(card.locator('.tr-extension-card__actions')).toHaveCount(1)
    await expect(card.getByRole('checkbox')).toHaveCount(0)
    await expect(card.getByRole('button', { name: '更多操作' })).toHaveCount(0)
  })

  test('allows empty arrays to suppress defaults and keeps standalone cards action-free', async ({ mount }) => {
    const component = await mount(ExtensionListDefaultActionsFixture)

    await expect(component.getByTestId('empty-actions-card').locator('.tr-extension-card__actions')).toHaveCount(0)
    await expect(component.getByTestId('standalone-card').locator('.tr-extension-card__actions')).toHaveCount(0)
  })
})
