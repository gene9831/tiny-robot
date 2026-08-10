<script setup lang="ts">
import type { App, Component } from 'vue'
import ExtensionManager from '../../../components/src/extension-manager'
import * as packageExports from '../../../components/src'

const Root = ExtensionManager.Root
const Filter = ExtensionManager.Filter
const List = ExtensionManager.List
const Card = ExtensionManager.Card
const McpDetail = ExtensionManager.McpDetail
const McpForm = ExtensionManager.McpForm
const standalonePrimitiveExports = [
  'ExtensionRoot',
  'ExtensionManagerRoot',
  'ExtensionFilter',
  'ExtensionList',
  'ExtensionCard',
  'ExtensionManagerContent',
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
  <output data-testid="root-name">{{ Root.name }}</output>
  <output data-testid="filter-name">{{ Filter.name }}</output>
  <output data-testid="list-name">{{ List.name }}</output>
  <output data-testid="card-name">{{ Card.name }}</output>
  <output data-testid="detail-name">{{ McpDetail.name }}</output>
  <output data-testid="form-name">{{ McpForm.name }}</output>
  <output data-testid="standalone-primitives">{{ standalonePrimitiveExports.join(',') }}</output>
  <output data-testid="legacy-picker">{{ 'McpServerPicker' in packageExports }}</output>
  <output data-testid="legacy-form">{{ 'McpAddForm' in packageExports }}</output>
  <output data-testid="detail-registration">{{ registrations.get('McpDetail') === McpDetail }}</output>
  <output data-testid="form-registration">{{ registrations.get('McpForm') === McpForm }}</output>
</template>
