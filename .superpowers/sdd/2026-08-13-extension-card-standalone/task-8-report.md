# Task 8 implementation report — control More Actions icon rendering

## Result

Implemented the standalone `ExtensionCard` overflow-menu icon visibility prop.

- Added public `ExtensionCardProps.overflowMenuShowIcons?: boolean`.
- Defaulted the Card prop to `true` and passed it to `ExtensionCardMoreMenu` as `showIcons`.
- Defaulted the internal MoreMenu prop to `true`.
- Made `hasActionIcons` false whenever `showIcons` is false, so MoreMenu renders no per-action icon slot, icon component, or icon placeholder while retaining labels and action events.
- Preserved Card’s existing `visibleActions` hidden-action filtering boundary; MoreMenu still receives already-visible actions and does not filter `hidden` itself.
- Added fixture/spec coverage with one icon-bearing and one iconless overflow action mounted with `:overflow-menu-show-icons="false"`.

## Files changed for this task

- `packages/components/src/extension-manager/index.type.ts`
- `packages/components/src/extension-manager/components/ExtensionCard.vue`
- `packages/components/src/extension-manager/components/ExtensionCardMoreMenu.vue`
- `packages/test/component/extension-manager/ExtensionCard.fixture.vue`
- `packages/test/component/extension-manager/ExtensionCard.spec.ts`
- `.superpowers/sdd/2026-08-13-extension-card-standalone/task-8-report.md`

The pre-staged `packages/components/src/extension-manager/components/ExtensionCardPopover.vue` and all unrelated dirty/untracked paths were left unchanged and excluded from the task commit.

## TDD evidence

- Red: the new focused test failed before the implementation because the false-prop fixture still rendered 2 `.tr-extension-card__more-menu-item-icon-slot` elements.
- Green: the same focused test passed after the implementation, including label visibility, absence of icon slot/component/placeholder selectors, and the button action event.

## Validation

- Focused CT: `ExtensionCard.spec.ts` — **9 passed**.
- Component type check: `packages/components/node_modules/.bin/vue-tsc --noEmit` — **passed**.
- Prettier check on all five implementation/test files — **passed**.
- `git diff --check` — **passed**.

## Environment notes / concerns

- The project-pinned pnpm wrapper was blocked by Corepack’s signature verification for `pnpm@10.34.5`; the fallback pnpm binary also attempted a modules-directory reconciliation, so package-local binaries were used for validation without changing dependencies.
- The test package’s standalone `vue-tsc` check reports existing unrelated layout-fixture errors requiring a `mode` prop. The changed ExtensionCard fixture compiles and mounts successfully in CT; no test-package layout files were modified.
- Playwright CT requires permission to bind its local server on port 3100; the final focused runs completed with that permission.
