<script setup lang="ts">
// Root/List Card integration is paused until an Extension-to-Card adapter is designed.
</script>

<template>
  <section class="card-use-case card-use-case--paused">
    <header class="card-use-case__header">
      <h3>Root + List + Card</h3>
      <p>Root/List 组合示例暂时停用，待 Extension-to-Card adapter 设计完成后恢复。</p>
    </header>
  </section>
</template>

<style scoped>
.card-use-case {
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
}

.card-use-case--paused {
  color: #667085;
}

.card-use-case__header h3 {
  margin: 0 0 6px;
  color: #1f2937;
  font-size: 18px;
}

.card-use-case__header p {
  margin: 0;
  font-size: 13px;
}
</style>
