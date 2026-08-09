---
outline: [1, 3]
---

# ExtensionManager 扩展管理组件

`ExtensionManager` 提供一组可组合的扩展管理原语，适合管理 MCP、Skill 以及后续扩展类型。它以统一的 `ExtensionRecord[]` 作为目录输入；页面的 Tabs、Sections、详情面板、表单和弹窗由业务方组合和管理。

## 最小组合

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { ExtensionRecord } from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'

const extensions = ref<ExtensionRecord[]>([
  {
    id: 'map-service',
    type: 'mcp',
    name: 'Map service',
    version: '1.0.0',
    tags: ['maps'],
    installation: { enabled: true },
  },
  {
    id: 'summary-skill',
    type: 'skill',
    name: 'Summary skill',
    tags: ['writing'],
  },
])
</script>

<template>
  <ExtensionManager.Root :extensions="extensions">
    <ExtensionManager.Filter />
    <TabsAndSections />
  </ExtensionManager.Root>
</template>
```

`ExtensionManager` 也提供一个预制的展示组件；需要自定义布局时，优先使用上面的 `Root` 组合式 API。

## 数据模型和投影链路

目录中的每条记录使用 `ExtensionRecord`：

```ts
interface ExtensionRecord<TMetadata = unknown> {
  id: string
  type: ExtensionType
  name: string
  version?: string
  icon?: string
  description?: string
  tags?: string[]
  metadata?: TMetadata
  installation?: {
    enabled: boolean
  }
}
```

- 有 `installation` 的记录是已安装扩展；没有 `installation` 的记录是市场安装候选。
- `installation.enabled` 是已安装扩展的运行开关。不要把 `enabled` 放在记录顶层。
- `version` 是可选元数据；首期不要求 `listing`、`catalogId` 或市场源字段。

Root 提供 Context，但不持有过滤条件。唯一的 `ExtensionManager.Filter` 在 Root 下消费完整目录并依次应用类型、标签和搜索条件：

```text
extensions/catalog
  -> Filter projection
  -> displayItems
  -> installedItems / marketItems
```

Root 的 `displayItems` 是当前展示投影；`installedItems` 和 `marketItems` 始终从它派生。页面中的 List/Card 不需要知道 Filter 是否存在，也不需要自己判断数据来自哪个过滤器。一个 Root 只能挂载一个 Filter；Filter 卸载后，Root 会恢复未过滤的投影。

## 宿主负责业务状态

组件只负责展示和发出稳定身份的 intent。宿主业务应持有目录、权限、确认流程、异步请求和操作状态，并在操作完成后更新 `extensions`。下面的 `displayItems` 来自 Root 的子组件；`useExtensionManagerContext` 必须在 Root 的后代组件中调用，不能在创建 Root 的同一个页面组件中调用：

```vue
<!-- ManagementPage.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import type {
  ExtensionIntent,
  ExtensionOperationStateMap,
  ExtensionRecord,
  ExtensionToggleIntent,
} from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'
import TabsAndSections from './TabsAndSections.vue'

const extensions = ref<ExtensionRecord[]>([])
const operationStates = ref<ExtensionOperationStateMap>({})
const installExtension = (_intent: ExtensionIntent) => {}
const toggleExtension = (_intent: ExtensionToggleIntent) => {}
const deleteExtension = (_intent: ExtensionIntent) => {}
const openDetail = (_intent: ExtensionIntent) => {}
</script>

<template>
  <ExtensionManager.Root
    :extensions="extensions"
    :operation-states="operationStates"
    @extension-add="installExtension"
    @extension-toggle="toggleExtension"
    @extension-delete="deleteExtension"
    @extension-detail-open="openDetail"
  >
    <ExtensionManager.Filter />
    <TabsAndSections />
  </ExtensionManager.Root>
</template>
```

`TabsAndSections.vue` 是 Root 的后代，因此可以安全消费 `displayItems`：

```vue
<!-- TabsAndSections.vue -->
<script setup lang="ts">
import { ExtensionManager, useExtensionManagerContext } from '@opentiny/tiny-robot'

const { displayItems } = useExtensionManagerContext()
</script>

<template>
  <ExtensionManager.List :items="displayItems.installed" source="installed">
    <ExtensionManager.Card v-for="item in displayItems.installed" :key="item.id" :item="item" />
  </ExtensionManager.List>
</template>
```

`operationStates` 是外部传入的短暂操作状态映射，例如安装、启停、删除、刷新和重试；Root 不执行异步操作，也不修改这份映射。详情、编辑/创建表单、Dialog、Drawer、权限判断和确认弹窗同样由宿主拥有。MCP 的详情可以使用 `McpExtensionDetail` 展示工具并发出独立的 `tool-toggle`，创建表单可以使用 `McpExtensionForm` 适配现有 MCP 表单；这两个组件都不拥有弹窗可见状态。

## 公共 API

组件可从包根导入，也可从 `ExtensionManager` namespace 使用：

```ts
import {
  ExtensionManager,
  ExtensionManagerRoot,
  ExtensionFilter,
  ExtensionList,
  ExtensionCard,
  McpExtensionDetail,
  McpExtensionForm,
  useExtensionManager,
  useExtensionManagerContext,
} from '@opentiny/tiny-robot'
```

组合式命名空间提供：

- `ExtensionManager.Root`：创建 Context 的 Root。
- `ExtensionManager.Filter`：唯一过滤投影器，自动收集目录中的 tags。
- `ExtensionManager.List`：列表布局、加载/错误/空状态和默认操作。
- `ExtensionManager.Card`：单条扩展的展示与操作控件。

## 从旧 MCP 组件迁移

`McpServerPicker` 和 `McpAddForm` 仍然保留并可继续使用，但已标记为 deprecated，后续 major release 计划移除。新代码应使用 `ExtensionManager` 的组合式结构：用统一目录和 `ExtensionFilter` 管理展示，用 `ExtensionList`/`ExtensionCard` 处理列表，用宿主自己的详情、表单和弹窗承载业务流程；MCP 创建场景可逐步替换为 `McpExtensionForm`。
