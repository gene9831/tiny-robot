---
outline: deep
---

# FlowLayout 流式布局组件

FlowLayout 流式布局组件用于自动换行显示子元素，当内容超出指定行数限制时，会显示"更多"按钮来展开剩余内容。支持点击和悬停两种触发方式，适用于标签、按钮等需要自动换行展示的场景。

> [!NOTE]
> 子元素请避免使用 margin 属性，否则可能会影响布局效果，调整间距请使用 `gap` prop。单行能容纳多少子元素根据子元素宽度来计算，子元素宽度使用 `getBoundingClientRect().width` 获取，这个 width 值不包含 margin。

## 代码示例

### 基本示例

基本用法，设置行数限制为2行，超出部分会显示在"更多"下拉列表中

<demo vue="../../../demos/flow-layout/basic.vue" />

## API

### FlowLayoutProps

流式布局组件的属性配置。

| 属性              | 类型                                                                              | 默认值                    | 说明                                                     |
| ----------------- | --------------------------------------------------------------------------------- | ------------------------- | -------------------------------------------------------- |
| `gap`             | `number \| string \| { rowGap?: number \| string, columnGap?: number \| string }` | -                         | 子元素间距，支持数字、字符串或对象形式设置行间距和列间距 |
| `linesLimit`      | `number`                                                                          | `Number.MAX_SAFE_INTEGER` | 显示的最大行数限制，默认不限制                           |
| `openMore`        | `boolean`                                                                         | `false`                   | 是否打开"更多"列表，支持 v-model 双向绑定                |
| `openMoreTrigger` | `'click' \| 'hover'`                                                              | `'click'`                 | 触发"更多"按钮显示的方式，可选值为 'click' 或 'hover'    |

### FlowLayoutSlots

流式布局组件的插槽定义。

| 插槽名        | 参数                  | 说明                                                                       |
| ------------- | --------------------- | -------------------------------------------------------------------------- |
| `default`     | -                     | 默认插槽，用于放置需要自动换行的子元素                                     |
| `moreTrigger` | `{ active: boolean }` | 自定义"更多"按钮插槽，接收激活状态参数，如果不提供则使用默认的向下箭头按钮 |

## CSS 变量

### FlowLayout 组件变量

更多列表容器

| 变量名                                     | 说明             |
| ------------------------------------------ | ---------------- |
| `--tr-flow-layout-more-list-top-gap`       | 更多列表顶部间距 |
| `--tr-flow-layout-more-list-bg`            | 更多列表背景色   |
| `--tr-flow-layout-more-list-box-shadow`    | 更多列表阴影效果 |
| `--tr-flow-layout-more-list-padding`       | 更多列表内边距   |
| `--tr-flow-layout-more-list-border-radius` | 更多列表圆角大小 |

## Data 属性

FlowLayout 组件提供了一些 data 属性，可以用于样式定制和功能识别：

| 属性名                | 说明                     |
| --------------------- | ------------------------ |
| `data-more-item` | 标识"更多"列表中的子元素 |
