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

  test('projects the market install operation state onto the matching card', async ({ mount }) => {
    const component = await mount(ExtensionListDefaultActionsFixture)

    await expect(component.getByTestId('market-card').getByRole('button', { name: '重试' })).toBeVisible()
  })

  test('maps install phases to stable action labels and disabled states', async ({ mount }) => {
    const component = await mount(ExtensionListDefaultActionsFixture)

    await expect(component.getByTestId('idle-market-card').getByRole('button', { name: '添加' })).toBeEnabled()
    await expect(component.getByTestId('pending-market-card').getByRole('button', { name: '添加中' })).toBeDisabled()
    await expect(component.getByTestId('successful-market-card').getByRole('button', { name: '已添加' })).toBeDisabled()
  })

  test('provides delete but no toggle for a passive installed extension', async ({ mount }) => {
    const component = await mount(ExtensionListDefaultActionsFixture)
    const card = component.getByTestId('passive-installed-card')

    await expect(card.getByRole('checkbox')).toHaveCount(0)
    await card.getByRole('button', { name: '更多操作' }).click()
    await expect(card.getByRole('button', { name: '删除' })).toBeVisible()
  })

  test('gives an explicit card id priority over item id for list defaults', async ({ mount }) => {
    const component = await mount(ExtensionListDefaultActionsFixture)

    await expect(component.getByTestId('explicit-id-card').getByRole('checkbox', { name: '停用扩展' })).toBeChecked()
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
