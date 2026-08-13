<script setup lang="ts">
import CardStandaloneDemo from './CardStandaloneDemo.vue'
</script>

<template>
  <div class="extension-card-demo">
    <header class="extension-card-demo__header">
      <h2>ExtensionCard</h2>
      <p>Card 可以独立使用；Root/List 集成示例暂时停用，等待 Extension-to-Card adapter 设计完成。</p>
    </header>

    <div class="extension-card-demo__cases">
      <!-- Root/List integration is paused until an Extension-to-Card adapter is designed. -->
      <CardStandaloneDemo />
    </div>
  </div>
</template>

<style scoped>
.extension-card-demo {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
}

.extension-card-demo__header {
  margin-bottom: 20px;
}

.extension-card-demo__header h2 {
  margin: 0 0 8px;
  color: #1f2937;
  font-size: 24px;
}

.extension-card-demo__header p {
  margin: 0;
  color: #667085;
}

.extension-card-demo__cases {
  display: grid;
  gap: 20px;
}
</style>
