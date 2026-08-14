# Task 1 Implementation Report: CardGrid public type contract

Date: 2026-08-14
Worktree: `/Users/gene/Projects/tiny-robot.worktrees/component-extension-ui`

## Result

Defined the public `CardGrid` type contract and added focused compile-time assertions. The implementation reuses the existing direct-props `ExtensionCardProps` and existing `ExtensionCardActionEvent`; `ExtensionCardProps` remains without `id`.

## Files changed

- `packages/components/src/extension-manager/index.type.ts`
  - Added `CardGridItem`, `CardGridProps`, `CardGridSlots`, `CardGridActionEvent`, `CardGridNameClickEvent`, and `CardGridEmits` with the exact Task 1 contract.
- `packages/components/src/extension-manager/index.type.test.ts`
  - Added positive assertions for flat items, required `items`, optional `columns`/`emptyText`, slot props, wrapped action/name-click payloads, and the emit overloads.
  - Added negative assertions proving Grid identity is not an `ExtensionCardProps` field and `CardGridItem` requires `id`.
- `.superpowers/sdd/2026-08-14-card-grid-standalone/task-1-report.md`
  - This report.

No implementation component, demo, Manager integration, or unrelated dirty file was changed.

## TDD evidence

### RED

Command:

```text
pnpm -F @opentiny/tiny-robot type-check
```

Exit status: `2`

Output:

```text
> @opentiny/tiny-robot@0.5.1 type-check /Users/gene/Projects/tiny-robot.worktrees/component-extension-ui/packages/components
> vue-tsc --noEmit

src/extension-manager/index.type.test.ts(3,3): error TS2305: Module './index.type' has no exported member 'CardGridActionEvent'.
src/extension-manager/index.type.test.ts(4,3): error TS2305: Module './index.type' has no exported member 'CardGridEmits'.
src/extension-manager/index.type.test.ts(5,3): error TS2305: Module './index.type' has no exported member 'CardGridItem'.
src/extension-manager/index.type.test.ts(6,3): error TS2305: Module './index.type' has no exported member 'CardGridNameClickEvent'.
src/extension-manager/index.type.test.ts(7,3): error TS2305: Module './index.type' has no exported member 'CardGridProps'.
src/extension-manager/index.type.test.ts(8,3): error TS2305: Module './index.type' has no exported member 'CardGridSlots'.
src/extension-manager/index.type.test.ts(89,12): error TS7031: Binding element 'item' implicitly has an 'any' type.
src/extension-manager/index.type.test.ts(89,18): error TS7031: Binding element 'index' implicitly has an 'any' type.
src/extension-manager/index.type.test.ts(119,1): error TS2578: Unused '@ts-expect-error' directive.
/Users/gene/Projects/tiny-robot.worktrees/component-extension-ui/packages/components:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @opentiny/tiny-robot@0.5.1 type-check: `vue-tsc --noEmit`
Exit status 2
```

The six missing-export errors are the intended RED failure. The implicit-`any` and unused-expect-error diagnostics are downstream from those missing declarations.

### GREEN

Command:

```text
pnpm -F @opentiny/tiny-robot type-check
```

Exit status: `0`

Output:

```text
> @opentiny/tiny-robot@0.5.1 type-check /Users/gene/Projects/tiny-robot.worktrees/component-extension-ui/packages/components
> vue-tsc --noEmit
```

Additional verification: `git diff --check` completed with no output or errors.

## Scope decisions

- Kept the contract flat: `CardGridItem` is `ExtensionCardProps & { id: string }`.
- Did not add `id` to `ExtensionCardProps`.
- Reused `ExtensionCardActionEvent` as the nested `CardGridActionEvent.action` payload.
- Kept the existing `ExtensionListProps`, `ExtensionListSlots`, and `ExtensionListEmits` declarations and all List consumers untouched. Removing that surface belongs to the later migration task, not Task 1.
- Added only public type assertions; no runtime or implementation-detail tests were introduced.
- Preserved pre-existing dirty files: `.gitignore`, `AGENTS.md`, `.pnpm-store/`, `.superpowers/`, `CONTEXT.md`, `docs/adr/`, and `docs/superpowers/` content outside this report.

## Stale List references for the next task

Search command:

```text
rg -n "ExtensionList|ExtensionManager\.List|components/ExtensionList|List\.vue" packages/components/src/extension-manager packages/demo/src packages/test/component/extension-manager
```

Remaining references are:

- Public type and export surface: `packages/components/src/extension-manager/index.type.ts`, `packages/components/src/extension-manager/components/index.ts`, and `packages/components/src/extension-manager/index.ts`.
- Existing List implementation and paused Manager composition: `packages/components/src/extension-manager/components/ExtensionList.vue` and `packages/components/src/extension-manager/components/ExtensionManagerContent.vue`.
- Existing type/namespace/List tests: `packages/components/src/extension-manager/index.type.test.ts`, `packages/test/component/extension-manager/ExtensionList.fixture.vue`, `packages/test/component/extension-manager/ExtensionList.spec.ts`, `packages/test/component/extension-manager/ExtensionManagerNamespace.fixture.vue`, and `packages/test/component/extension-manager/ExtensionManagerNamespace.spec.ts`.
- Demo routes and consumers: `packages/demo/src/App.vue`, `packages/demo/src/router.ts`, `packages/demo/src/components/List.vue`, and `packages/demo/src/components/ExtensionManagerContent.vue`.

These are intentionally recorded, not removed, in this task.

## Concerns

No blocking concerns. The stale List public/consumer surface remains intentionally for the subsequent migration task.

Planned commit message: `feat(components): define CardGrid public type contract`
