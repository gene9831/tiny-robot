# ExtensionManager Work Brief

## Main Goal

Build a new extension management component named `ExtensionManager` for managing multiple AI extension types in TinyRobot. The initial supported types are MCP and Skills. Existing MCP management capabilities should eventually migrate into this component so MCP and Skills share one consistent management experience.

## Component Scope

`ExtensionManager` is responsible for the full management surface:

- Display installed extensions and extension marketplace items.
- Switch between extension types, initially `mcp` and `skill`.
- Search and filter extensions.
- Add marketplace extensions.
- Add custom extensions where supported.
- Enable or disable installed extensions.
- Edit, delete, and refresh extensions where supported.
- Show installation progress, loading states, empty states, and failure states.

The component should be generic enough to support future extension types such as prompts, workflows, connectors, or tools without renaming the public API.

## Naming

Use `Extension` as the shared domain prefix. Do not use `Agent` in public component or type names.

Recommended component names:

- `ExtensionManager`: top-level orchestration component.
- `ExtensionTabs`: extension type tabs, such as MCP and Skills.
- `ExtensionToolbar`: search, filters, and custom add action.
- `ExtensionSection`: collapsible sections such as installed items and marketplace items.
- `ExtensionList`: grid/list rendering and list-level states.
- `ExtensionCard`: single extension item display.
- `ExtensionActions`: card actions such as toggle, add, edit, and delete.
- `ExtensionDetailDialog`: optional standalone detail container for MCP and Skill details.
- `McpExtensionDetail`: MCP-specific detail view, including tools and tool toggles.
- `SkillExtensionDetail`: Skill-specific detail view, if Skills need secondary configuration.
- `ExtensionAddDialog`: custom add dialog wrapper.
- `McpExtensionForm`: MCP-specific add/edit form.
- `SkillExtensionForm`: Skills-specific add/edit form, if needed.

Recommended type names:

- `ExtensionType`
- `ExtensionSource`
- `ExtensionAddState`
- `ExtensionItem`
- `ExtensionCardPrimaryAction`
- `ExtensionTagOption`
- `ExtensionListProps`
- `ExtensionListEmits`
- `ExtensionManagerProps`
- `ExtensionManagerEmits`
- `McpExtensionMetadata`

## Responsibility Split

Keep the top-level component focused on state coordination and event routing. Avoid putting card details, form details, or type-specific MCP/Skills logic directly in `ExtensionManager`.

`ExtensionManager` should coordinate:

- active extension type
- section expansion state
- search and tag filter state
- installed and marketplace data
- event dispatching

`ExtensionList` should handle:

- list-level loading and empty states
- two-column to one-column responsive grid layout
- mapping `ExtensionItem` data into `ExtensionCard` props
- mapping `source` into the card primary action, such as toggle for installed items and add for market items
- forwarding item-level events such as add, toggle, delete, and detail open
- summary metadata text, such as MCP tool count, without rendering long detail content

`ExtensionCard` should handle:

- icon, name, and description display
- compact primary action presentation through `primaryAction`
- optional secondary delete action through `deleteAction`
- enabled state display when the primary action is toggle
- add state and progress display when the primary action is add
- compact item-level interaction

`ExtensionCard` should not know list source names such as `installed` or `market`. Source-to-action mapping belongs in `ExtensionList` or an adapter layer.

`ExtensionDetailDialog` should handle:

- standalone detail display for the selected extension
- MCP tool list and tool-level enable/disable controls
- Skill-specific detail content when needed
- desktop and mobile presentation decisions such as modal, drawer, or full-screen dialog

`ExtensionManager` should open details by emitting an intent event such as `extension-detail-open`. The manager should not own the detail container shape.

`ExtensionAddDialog` should handle:

- dialog visibility
- add mode selection, if required
- delegating to type-specific forms
- confirm and cancel events

Type-specific forms should handle only the fields and validation for that type. MCP transport fields should remain inside MCP-specific code, not in generic extension components.

## Layout and Container Strategy

`ExtensionManager` should be a content management panel, not a fixed popup component.

The same component must work in multiple host environments:

- embedded settings page
- business modal
- drawer
- floating panel

Do not bake popup responsibilities into `ExtensionManager`, such as fixed positioning, mask, z-index, drawer animation, body scroll lock, or focus trap. If a popup version is needed later, create wrapper components such as `ExtensionManagerModal` or `ExtensionManagerDrawer` that render `ExtensionManager` inside a container.

`ExtensionManager` may expose lightweight header controls such as `showHeader`, `showCloseButton`, or a `close` event, but closing a modal or drawer is the host component's responsibility.

## Detail Strategy

MCP and Skill details should be independent from the list layout.

The base list card should show only summary-level information:

- extension icon, name, and description
- enabled state
- add state
- concise metadata such as `15 tools` or `8 enabled`
- entry action such as configure/details

Do not render MCP tools directly inside a two-column card as the default experience. Tool lists can become tall and force the neighboring card in the same CSS grid row to stretch, which makes the management list harder to scan.

Preferred behavior:

- Card-level actions handle primary operations such as add, enable, disable, edit, delete, and open detail.
- MCP tool toggles live in `McpExtensionDetail`.
- Skill-specific secondary configuration lives in `SkillExtensionDetail`.
- The host decides whether details appear as a modal, drawer, or full-screen dialog.

This keeps `ExtensionManager` independent from whether it is embedded in a page or placed inside an existing popup.

## Card Height Strategy

Cards in two-column layouts should keep a stable height whenever possible.

Avoid putting variable-height secondary content into the card body:

- MCP tool lists
- long configuration forms
- verbose logs
- multi-line detail tables

Installation progress should also avoid changing card height. Prefer one of these patterns:

- show progress as an absolutely positioned bar at the bottom of a fixed-height card
- show loading/progress text inside the add button
- reserve a fixed status area in every market card

`ExtensionCard` currently uses an absolutely positioned progress bar for add loading state. If `primaryAction.progress` is a number, show determinate progress clamped to `0-100`. If it is not a number or is omitted, show an indeterminate animated progress bar.

The list should remain easy to scan while status changes happen.

## MCP Migration Target

Existing MCP features from `mcp-server-picker` and `mcp-add-form` should be migrated into the new extension architecture over time.

The target behavior should preserve current MCP capabilities:

- installed MCP list
- MCP marketplace list
- MCP search and tag filtering
- MCP add states: idle, loading, added, failed
- custom MCP add form/code modes
- MCP enable/disable
- MCP delete
- MCP tool-level enable/disable where tools are present

During migration, prefer adapting existing MCP types and behavior to the new `Extension*` model instead of duplicating a separate MCP-only management surface.

## Data Model Direction

Use a generic extension item shape with optional type-specific metadata:

```ts
type ExtensionType = 'mcp' | 'skill'
type ExtensionSource = 'installed' | 'market'
type ExtensionAddState = 'idle' | 'loading' | 'added' | 'failed'

interface ExtensionItem<TMetadata = Record<string, unknown>> {
  id: string
  type: ExtensionType
  name: string
  icon?: string
  description?: string
  enabled?: boolean
  tags?: string[]
  addState?: ExtensionAddState
  progress?: number
  metadata?: TMetadata
}

interface McpExtensionMetadata {
  tools?: Array<{
    id: string
    name: string
    description?: string
    enabled?: boolean
  }>
}
```

MCP extensions may provide tools through MCP-specific metadata, for example `ExtensionItem<McpExtensionMetadata>`. Skills should not be forced to provide tool data.

`tags` replaces the earlier `category` field. A single item can belong to multiple groups such as `search`, `official`, `local`, or `recommended`. Tag filtering currently uses a single selected tag; multi-select can be added later without changing item data.

## Current Card And List API

`ExtensionCard` uses action objects instead of parallel `showToggle` and `showAdd` flags. The card has one primary action at a time.

```ts
type ExtensionCardPrimaryAction =
  | {
      type: 'toggle'
      enabled?: boolean
      disabled?: boolean
    }
  | {
      type: 'add'
      state?: ExtensionAddState
      progress?: number
      disabled?: boolean
    }

interface ExtensionCardProps {
  name: string
  description?: string
  descriptionLines?: number
  icon?: string
  iconAlt?: string
  nameClickable?: boolean
  primaryAction?: ExtensionCardPrimaryAction
  deleteAction?: {
    disabled?: boolean
  }
}
```

The current priority rule is encoded by the single `primaryAction` field. Consumers should pass either `{ type: 'toggle' }` or `{ type: 'add' }`, not both.

`ExtensionList` is the current extraction layer above cards:

```ts
interface ExtensionListProps {
  items?: ExtensionItem[]
  source: ExtensionSource
  loading?: boolean
  emptyText?: string
}
```

`ExtensionList` maps `source === 'installed'` to a toggle primary action and delete action. It maps `source === 'market'` to an add primary action. Higher-level permission flags currently belong in `ExtensionManager` or the calling adapter, not in `ExtensionCard`.

## API Design Notes

Prefer controlled data and event-driven updates. The component should emit user intent and let the consumer update data.

Expected event categories:

- type or tab change
- search and tag filter change
- add marketplace extension
- create custom extension
- open extension detail
- enable or disable extension
- enable or disable extension tool
- edit extension
- delete extension
- refresh list

Behavior flags should remain explicit, for example:

- `allowExtensionAdd`
- `allowExtensionCreate`
- `allowExtensionEdit`
- `allowExtensionDelete`
- `allowExtensionToggle`
- `allowToolToggle`

## Current Demo Pages

The temporary demo project under `packages/demo` is the current fast preview surface. Do not use docs for local component iteration.

- `packages/demo/src/components/Card.vue`: previews `ExtensionManager.Card` props, primary action modes, delete action, and determinate or indeterminate progress.
- `packages/demo/src/components/List.vue`: previews `ExtensionManager.List` with installed and market sources, loading states, empty text, and item-level events.
- `packages/demo/src/components/Manager.vue`: previews the composed `ExtensionManager` behavior with tabs, search, tag filter, sections, and emitted events.

## Implementation Guidelines

- Follow existing TinyRobot component patterns under `packages/components/src`.
- Reuse existing MCP picker and add-form logic where practical.
- Keep generic extension components free from MCP-only names.
- Keep MCP-specific fields, validation, and transport concepts inside MCP-specific form or adapter code.
- Preserve backwards compatibility where possible while introducing the new component.
- Add documentation and demos alongside the component once implementation starts.
- Add focused tests for event emission, filtering, tab switching, card action states, and MCP migration behavior.
