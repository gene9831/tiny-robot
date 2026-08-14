<script setup lang="ts">
import CardGridDemo from './CardGridDemo.vue'
</script>

<template>
  <div class="card-grid-page">
    <header class="card-grid-page__header">
      <div>
        <div class="card-grid-page__eyebrow">CardGrid</div>
        <h1>CardGrid 组件示例</h1>
        <p>直接传入扁平的 items，查看默认卡片、列数、插槽、空状态和事件 payload。</p>
      </div>

      <div class="card-grid-page__contract">
        <strong>接口提示</strong>
        <code>items: CardGridItem[]</code>
        <span>Grid 保留字符串 id，用它生成 key 和 data-card-id。</span>
      </div>
    </header>

    <CardGridDemo />
  </div>
</template>

<style scoped>
.card-grid-page {
  box-sizing: border-box;
  width: min(1180px, 100%);
  margin: 0 auto;
  padding: 28px;
  border: 1px solid #dbe7f6;
  border-radius: 24px;
  background: #f7faff;
  box-shadow: 0 18px 50px rgb(66 99 151 / 12%);
}

.card-grid-page__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(240px, 320px);
  gap: 28px;
  align-items: end;
  padding: 14px 4px 30px;
}

.card-grid-page__eyebrow {
  margin-bottom: 12px;
  color: #607ce9;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.card-grid-page h1 {
  margin: 0;
  color: #14233b;
  font-size: clamp(32px, 5vw, 52px);
  letter-spacing: -0.06em;
  line-height: 0.98;
}

.card-grid-page__header p {
  max-width: 520px;
  margin: 16px 0 0;
  color: #6b7e9c;
  font-size: 14px;
  line-height: 1.55;
}

.card-grid-page__contract {
  display: grid;
  gap: 8px;
  padding: 17px;
  border: 1px solid #d9e7fb;
  border-radius: 16px;
  background: rgb(255 255 255 / 72%);
  color: #6b7e9c;
  font-size: 12px;
  line-height: 1.55;
}

.card-grid-page__contract strong {
  color: #243f75;
  font-size: 13px;
}

.card-grid-page__contract code {
  color: #526fe4;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
  font-size: 11px;
}

@media (max-width: 720px) {
  .card-grid-page {
    padding: 18px;
    border-radius: 18px;
  }

  .card-grid-page__header {
    grid-template-columns: 1fr;
    gap: 18px;
    padding-bottom: 24px;
  }
}
</style>
