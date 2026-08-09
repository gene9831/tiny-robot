<script setup lang="ts">
import type { App, Component } from 'vue'
import ExtensionManager, {
  McpExtensionDetail,
  McpExtensionForm,
} from '../../../components/src/extension-manager'

const registrations = new Map<string, Component>()
const app = {
  component(name: string, component: Component) {
    registrations.set(name, component)
    return this
  },
} as unknown as App

ExtensionManager.install(app)
</script>

<template>
  <output data-testid="detail-name">{{ McpExtensionDetail.name }}</output>
  <output data-testid="form-name">{{ McpExtensionForm.name }}</output>
  <output data-testid="detail-registration">{{ registrations.get('McpExtensionDetail') === McpExtensionDetail }}</output>
  <output data-testid="form-registration">{{ registrations.get('McpExtensionForm') === McpExtensionForm }}</output>
</template>
