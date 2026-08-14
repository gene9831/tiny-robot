<script setup lang="ts">
import CardActionDemo from './CardActionDemo.vue'
import CardCustomActionDemo from './CardCustomActionDemo.vue'
import CardIdentityDemo from './CardIdentityDemo.vue'
import CardProgressDemo from './CardProgressDemo.vue'
</script>

<template>
  <section class="card-pattern-gallery">
    <div class="card-pattern-gallery__title">
      <h3>可复用示例</h3>
      <span>四个聚焦模式</span>
    </div>
    <div class="card-pattern-gallery__grid">
      <CardIdentityDemo />
      <CardActionDemo />
      <CardProgressDemo />
      <CardCustomActionDemo />
    </div>
  </section>
</template>

<style scoped>
.card-pattern-gallery__title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.card-pattern-gallery__title h3 {
  margin: 0;
  color: #253a60;
  font-size: 15px;
}

.card-pattern-gallery__title span {
  color: #8aa0c2;
  font-size: 11px;
}

.card-pattern-gallery__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 760px) {
  .card-pattern-gallery__grid {
    grid-template-columns: 1fr;
  }
}
</style>
