import { expect, test } from '@playwright/experimental-ct-vue'
import ExtensionNormalizationFixture from './ExtensionNormalization.fixture.vue'

test.describe('Extension normalization', () => {
  test('defaults availability and removes configuration from uninstalled extensions', async ({ mount }) => {
    const component = await mount(ExtensionNormalizationFixture)

    await expect(component.getByTestId('available-installed')).toHaveText('false')
    await expect(component.getByTestId('installed-passive-installed')).toHaveText('true')
    await expect(component.getByTestId('available-with-config-installed')).toHaveText('false')
    await expect(component.getByTestId('available-with-config-has-config')).toHaveText('false')
  })
})
