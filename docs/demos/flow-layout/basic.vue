<script setup lang="ts">
import { TrFlowLayout } from '@opentiny/tiny-robot'
import { ref } from 'vue'

const items = ref<string[]>([
  'hello',
  'world',
  'foo',
  'bar',
  'baz',
  'qux',
  'quux',
  'quuz',
  'sixsixsixsixsix',
  'hello world',
  'seven',
])

const addItem = () => {
  items.value.push(Math.random().toString(36).substring(2, 15))
}

const removeItem = () => {
  items.value.pop()
}

const openMore = ref(false)

const handleClick = (item: string) => {
  console.log(item)
  openMore.value = false
}
</script>

<template>
  <div style="display: flex; gap: 10px; margin-bottom: 10px">
    <button @click="addItem">add</button>
    <button @click="removeItem">remove</button>
  </div>
  <TrFlowLayout :lines-limit="1" class="custom-flow-layout" v-model:open-more="openMore" open-more-trigger="hover">
    <button v-for="item in items" :key="item" @click="handleClick(item)">{{ item }}</button>
  </TrFlowLayout>
</template>

<style scoped lang="less">
.custom-flow-layout {
  background: white;
  padding: 10px;
  border-radius: 8px;
}

button {
  border: 1px solid #ccc;
  min-width: 48px;
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
  background-color: #fff;
  &:hover {
    background-color: #f0f0f0;
  }
}

:deep(.tr-flow-layout-more-list-content) {
  padding: 4px;
  border-radius: 12px;

  button {
    border: none;
    border-radius: 8px;
  }
}
</style>
