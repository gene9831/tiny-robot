<script setup lang="ts">
import AppNormal from './AppNormal.vue'
</script>

<template>
  <div class="main-container">
    <div class="header">
      <h1 class="text-center">Component VS Shadow DOM</h1>
    </div>
    <div class="main">
      <div class="left-side">
        <AppNormal />
      </div>
      <div class="right-side">
        <app-shadow />
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-container {
  width: 100%;
  height: 100%;
}
.header {
  text-align: center;
}
.main {
  display: flex;
  flex-direction: row;
  gap: 10px;
  padding: 10px;
}

.left-side,
.right-side {
  flex: 1;
  padding: 100px 10px;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
}
</style>
