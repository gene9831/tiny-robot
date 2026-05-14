<template>
  <div><slot /></div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { provideChatContext } from '../context'

const sidebarLeftOpen = ref(true)
provideChatContext({ sidebarLeftOpen })
</script>
