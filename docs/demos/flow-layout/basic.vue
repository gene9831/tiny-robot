<script setup lang="ts">
import { TrDropdownMenu, TrFlowLayout } from '@opentiny/tiny-robot'
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

const gap = ref(10)

const linesWhenCollapse = 2
const linesLimit = ref(linesWhenCollapse)

const handleExpand = (isMore: boolean) => {
  if (isMore) {
    linesLimit.value = Number.MAX_SAFE_INTEGER
  } else {
    linesLimit.value = linesWhenCollapse
  }
}

const leftCount = ref(0)

const getDropdownItems = (visibleItemCount: number) => {
  leftCount.value = items.value.length - visibleItemCount
  return items.value.slice(visibleItemCount).map((item) => ({ id: item, text: item }))
}

const handleClick = (item: string) => {
  console.log(item)
}
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
  <hr />
  <p>expand</p>
  <TrFlowLayout :items="items" :gap="gap" :lines-limit="linesLimit">
    <template #item="{ item }">
      <button @click="handleClick(item)">{{ item }}</button>
    </template>
    <template #moreTrigger="{ visibleItemCount }">
      <button
        class="more-trigger"
        v-show="!(items.length === visibleItemCount && linesLimit === linesWhenCollapse)"
        @click="handleExpand(items.length > visibleItemCount)"
      >
        {{ items.length > visibleItemCount ? `${items.length - visibleItemCount} more` : 'less' }}
      </button>
    </template>
  </TrFlowLayout>
  <hr />
  <p>dropdown</p>
  <TrFlowLayout :items="items" :gap="gap" :lines-limit="2">
    <template #item="{ item }">
      <button @click="handleClick(item)">{{ item }}</button>
    </template>
    <template #moreTrigger="{ visibleItemCount }">
      <TrDropdownMenu
        :items="getDropdownItems(visibleItemCount)"
        placement="bottom-right"
        @item-click="(e) => handleClick(e.text)"
      >
        <template #trigger>
          <button class="more-trigger" :class="{ hidden: leftCount <= 0 }">{{ leftCount }} more</button>
        </template>
      </TrDropdownMenu>
    </template>
  </TrFlowLayout>
</template>

<style scoped lang="less">
button {
  border: 1px solid #ccc;
  min-width: 48px;
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
  background-color: var(--tr-container-bg-default);
  &:hover {
    background-color: var(--tr-container-bg-hover);
  }
}

.more-trigger {
  border: none;
  &.hidden {
    position: absolute;
    visibility: hidden;
  }
}
</style>
