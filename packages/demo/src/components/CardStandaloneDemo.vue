<script setup lang="ts">
import CardStandaloneInstallDemo from './CardStandaloneInstallDemo.vue'
import CardStandaloneInstalledDemo from './CardStandaloneInstalledDemo.vue'
</script>

<template>
  <section class="card-use-case">
    <header class="card-use-case__header">
      <h3>1. Standalone Card</h3>
      <p>Card 只接收直接展示字段和 action 配置，不需要 Root 或 List。</p>
    </header>

    <div class="card-standalone-cases">
      <CardStandaloneInstallDemo />
      <CardStandaloneInstalledDemo />
    </div>
  </section>
</template>

<style scoped>
.card-use-case {
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
}

.card-use-case__header {
  margin-bottom: 16px;
}

.card-use-case__header h3 {
  margin: 0 0 6px;
  font-size: 18px;
}

.card-use-case__header p {
  margin: 0;
  color: #667085;
  font-size: 13px;
}

.card-standalone-cases {
  display: grid;
  gap: 16px;
}
</style>
