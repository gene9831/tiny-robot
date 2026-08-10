<script setup lang="ts">
import type { ExtensionInput } from '../../../components/src/extension-manager/index.type'
import { normalizeExtensions } from '../../../components/src/extension-manager/normalizeExtension'

const inputs: ExtensionInput[] = [
  { id: 'available', kind: 'skill', name: 'Available skill' },
  { id: 'installed-passive', kind: 'skill', name: 'Installed skill', installed: true },
  {
    id: 'available-with-config',
    kind: 'mcp',
    name: 'Invalid available config',
    config: { enabled: true },
  },
]

const extensions = normalizeExtensions(inputs)
</script>

<template>
  <output data-testid="available-installed">{{ extensions[0].installed }}</output>
  <output data-testid="installed-passive-installed">{{ extensions[1].installed }}</output>
  <output data-testid="available-with-config-installed">{{ extensions[2].installed }}</output>
  <output data-testid="available-with-config-has-config">{{ 'config' in extensions[2] }}</output>
</template>
