import type { Preview } from '@storybook/vue3-vite'
import { themes } from 'storybook/theming'
import '../../components/src/styles/root.css'
import '../../components/src/styles/components/index.css'
import './preview.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      codePanel: true,
      source: {
        type: 'dynamic',
      },
      theme: themes.normal,
    },
  },
}

export default preview
