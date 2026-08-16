<script setup lang="ts">
import type { App, Component } from 'vue'
import ExtensionManager from '../../../components/src/extension-manager'
import * as packageExports from '../../../components/src'
import type { ExtensionManagerTab } from '../../../components/src/extension-manager/index.type'

const Manager = ExtensionManager
const Root = ExtensionManager.Root
const Filter = ExtensionManager.Filter
const Card = ExtensionManager.Card
const CardGrid = ExtensionManager.CardGrid
const McpDetail = ExtensionManager.McpDetail
const McpForm = ExtensionManager.McpForm
const managerTabs: ExtensionManagerTab[] = [{ id: 'library', label: 'Library', items: [] }]
const hasList = 'List' in ExtensionManager
const standalonePrimitiveExports = [
  'ExtensionRoot',
  'ExtensionManagerRoot',
  'ExtensionFilter',
  'ExtensionCard',
  'ExtensionCardGrid',
  'McpExtensionDetail',
  'McpExtensionForm',
  'McpDetail',
  'McpForm',
].filter((name) => name in packageExports)

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
  <div data-testid="manager-surface">
    <Manager :tabs="managerTabs" />
  </div>
  <output data-testid="manager-name">{{ Manager.name }}</output>
  <output data-testid="manager-list">{{ hasList }}</output>
  <output data-testid="root-name">{{ Root.name }}</output>
  <output data-testid="filter-name">{{ Filter.name }}</output>
  <output data-testid="card-name">{{ Card.name }}</output>
  <output data-testid="card-grid-name">{{ CardGrid.name }}</output>
  <output data-testid="detail-name">{{ McpDetail.name }}</output>
  <output data-testid="form-name">{{ McpForm.name }}</output>
  <output data-testid="standalone-primitives">{{ standalonePrimitiveExports.join(',') }}</output>
  <output data-testid="legacy-picker">{{ 'McpServerPicker' in packageExports }}</output>
  <output data-testid="legacy-form">{{ 'McpAddForm' in packageExports }}</output>
  <output data-testid="manager-registration">{{ registrations.get('ExtensionManager') === Manager }}</output>
  <output data-testid="content-registration">{{ registrations.has('ExtensionManagerContent') }}</output>
  <output data-testid="detail-registration">{{ registrations.get('McpDetail') === McpDetail }}</output>
  <output data-testid="form-registration">{{ registrations.get('McpForm') === McpForm }}</output>
  <output data-testid="card-grid-registration">{{ registrations.get('ExtensionCardGrid') === CardGrid }}</output>
</template>
