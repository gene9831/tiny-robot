<script setup lang="ts">
import CardPatternGallery from './CardPatternGallery.vue'
import CardPlaygroundDemo from './CardPlaygroundDemo.vue'
</script>

<template>
  <div class="card-gallery-page">
    <header class="card-gallery-page__header">
      <div>
        <div class="card-gallery-page__eyebrow">card / patterns</div>
        <h2>See the pattern.<br />Try the detail.</h2>
        <p>A small library of direct-input Card patterns, ready to read and reuse.</p>
      </div>
      <div class="card-gallery-page__principle">
        <strong>Page principle</strong>
        Every example explains one input or interaction result without importing a larger product context.
      </div>
    </header>

    <CardPatternGallery />

    <section class="card-gallery-page__playground" aria-labelledby="card-playground-heading">
      <div class="card-gallery-page__section-heading">
        <div>
          <div class="card-gallery-page__eyebrow">live composition</div>
          <h3 id="card-playground-heading">Interactive playground</h3>
        </div>
        <span>one card / many inputs</span>
      </div>
      <CardPlaygroundDemo />
    </section>
  </div>
</template>

<style scoped>
.card-gallery-page {
  box-sizing: border-box;
  width: min(1180px, 100%);
  margin: 0 auto;
  padding: 28px;
  border: 1px solid #dbe7f6;
  border-radius: 24px;
  background: #f7faff;
  box-shadow: 0 18px 50px rgb(66 99 151 / 12%);
}

.card-gallery-page__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(240px, 320px);
  gap: 28px;
  align-items: end;
  padding: 14px 4px 30px;
}

.card-gallery-page__eyebrow {
  margin-bottom: 12px;
  color: #607ce9;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.card-gallery-page__header h2 {
  margin: 0;
  color: #14233b;
  font-size: clamp(32px, 5vw, 52px);
  letter-spacing: -0.06em;
  line-height: 0.98;
}

.card-gallery-page__header p {
  max-width: 440px;
  margin: 16px 0 0;
  color: #6b7e9c;
  font-size: 14px;
  line-height: 1.55;
}

.card-gallery-page__principle {
  padding: 17px;
  border: 1px solid #d9e7fb;
  border-radius: 16px;
  background: rgb(255 255 255 / 72%);
  color: #6b7e9c;
  font-size: 12px;
  line-height: 1.55;
}

.card-gallery-page__principle strong {
  display: block;
  margin-bottom: 6px;
  color: #243f75;
  font-size: 13px;
}

.card-gallery-page__playground {
  margin-top: 32px;
  padding-top: 28px;
  border-top: 1px solid #e0eafa;
}

.card-gallery-page__section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.card-gallery-page__section-heading h3 {
  margin: 0;
  color: #253a60;
  font-size: 22px;
  letter-spacing: -0.03em;
}

.card-gallery-page__section-heading > span {
  padding: 5px 8px;
  border-radius: 999px;
  background: #e3f7f0;
  color: #4b9d89;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

@media (max-width: 720px) {
  .card-gallery-page {
    padding: 18px;
    border-radius: 18px;
  }

  .card-gallery-page__header {
    grid-template-columns: 1fr;
    gap: 18px;
    padding-bottom: 24px;
  }

  .card-gallery-page__section-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }
}
</style>
