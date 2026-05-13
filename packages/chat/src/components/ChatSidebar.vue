<template>
  <div class="chat-sidebar"><slot></slot></div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'TinyRobotChatSidebar',
})
</script>

<style scoped>
.chat-sidebar {
  width: 300px;
}
</style>
