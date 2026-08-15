import { fileURLToPath } from 'node:url'
import type { StorybookConfig } from '@storybook/vue3-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
  core: {
    disableProjectJson: true,
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },
  viteFinal: async (config) => {
    const existingAliases = config.resolve?.alias
    const aliases = Array.isArray(existingAliases)
      ? existingAliases
      : Object.entries(existingAliases ?? {}).map(([find, replacement]) => ({ find, replacement }))

    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: [
          ...aliases,
          {
            find: /^@opentiny\/tiny-robot$/,
            replacement: fileURLToPath(new URL('../../components/src/index.ts', import.meta.url)),
          },
          {
            find: /^@opentiny\/tiny-robot-svgs$/,
            replacement: fileURLToPath(new URL('../../svgs/src/index.ts', import.meta.url)),
          },
        ],
      },
    }
  },
}

export default config
