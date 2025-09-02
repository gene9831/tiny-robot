<script setup lang="ts">
import { TrFlowLayout } from '@opentiny/tiny-robot'
import { ref } from 'vue'

const items = ref<string[]>(
  ['hello', 'world', 'foo', 'bar', 'baz', 'qux', 'quux', 'quuz', 'sixsixsixsixsix', 'hello world', 'seven'].flatMap(
    (item) => [item, item],
  ),
)

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

const gap = ref(10)
</script>

<template>
  <div style="display: flex; gap: 10px; margin-bottom: 10px">
    <button @click="addItem">add</button>
    <button @click="removeItem">remove</button>
  </div>
  <div>
    <label>gap（支持不同单位）: </label>
    <input v-model="gap" style="border: 1px solid #ccc; border-radius: 4px; padding: 2px 8px" />
  </div>
  <TrFlowLayout :lines-limit="2" :gap="gap" class="custom-flow-layout" v-model:open-more="openMore">
    <button v-for="(item, index) in items" :key="index" @click="handleClick(item)">{{ item }}</button>
    <template #moreTrigger="{ active }">
      <button class="more-trigger" :class="{ active }">more</button>
    </template>
  </TrFlowLayout>
</template>

<style scoped lang="less">
.custom-flow-layout {
  --tr-flow-layout-more-list-padding: 4px;
  --tr-flow-layout-more-list-border-radius: 12px;

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

  &[data-more-item='true'] {
    border: none;
    border-radius: 8px;
  }
}

.more-trigger {
  border: none;
  &.active {
    background-color: #f0f0f0;
  }
}
</style>
