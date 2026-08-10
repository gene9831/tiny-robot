<script setup lang="ts">
import type { App, Component } from 'vue'
import ExtensionManager from '../../../components/src/extension-manager'

const McpDetail = ExtensionManager.McpDetail
const McpForm = ExtensionManager.McpForm

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
  <output data-testid="detail-name">{{ McpDetail.name }}</output>
  <output data-testid="form-name">{{ McpForm.name }}</output>
  <output data-testid="detail-registration">{{ registrations.get('McpDetail') === McpDetail }}</output>
  <output data-testid="form-registration">{{ registrations.get('McpForm') === McpForm }}</output>
</template>
