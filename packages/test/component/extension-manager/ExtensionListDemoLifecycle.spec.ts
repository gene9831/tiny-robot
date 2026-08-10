import { expect, test } from '@playwright/experimental-ct-vue'
import ExtensionListDemo from '../../../demo/src/components/List.vue'

test.describe('ExtensionList demo operation lifecycle', () => {
  test('clears a completed install status when deleting the installed item', async ({ mount }) => {
    const component = await mount(ExtensionListDemo)
    const itemCard = component.locator('.tr-extension-card').filter({ hasText: '资料调研' })

    await itemCard.getByRole('button', { name: '重试' }).click()
    await expect(itemCard.getByRole('button', { name: '更多操作' })).toBeVisible()

    await itemCard.getByRole('button', { name: '更多操作' }).click()
    await itemCard.getByRole('button', { name: '删除' }).click()

    await expect(itemCard.getByRole('button', { name: '安装' })).toBeEnabled()
  })
})
