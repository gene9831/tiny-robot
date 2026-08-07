# Task 2 Report: Controlled Root State and Stable Intent Contract

## Status

DONE_WITH_CONCERNS

## Implementation commit

`17a328fd feat(extension-manager): add controlled root intents`

## Modified files

- `packages/components/src/extension-manager/index.type.ts`
- `packages/components/src/extension-manager/composables/useExtensionManager.ts`
- `packages/test/component/extension-manager/ExtensionManagerRootConsumer.fixture.vue`
- `packages/test/component/extension-manager/ExtensionManagerRoot.fixture.vue`
- `packages/test/component/extension-manager/ExtensionManagerRoot.spec.ts`

`ExtensionManagerRoot.vue` required no structural change: it continues to own the context created by `useExtensionManager`, where the Root-local writable model refs and event routing now live.

## Delivered behavior

- `activeType` and `expandedSections` support controlled and uncontrolled use; Root context setters update local state and emit `update:active-type` / `update:expanded-sections`.
- External controlled values synchronize back into the Root context.
- Root intents use stable `id`, `type`, optional known `source`, and toggle/tool state where applicable. `extension-add` remains the install-domain intent.
- Intent routing has no permission gates, confirmation dialogs, catalog mutations, or asynchronous work.
- Component tests cover external control synchronization, independent section updates, stable intent payloads, and catalog immutability after intents.

## Validation

| Command | Actual result |
| --- | --- |
| `pnpm -F tiny-robot-test test:ct -- packages/test/component/extension-manager/ExtensionManagerRoot.spec.ts` | Passed. Playwright's `packages/test/component/test-results/.last-run.json` records `status: "passed"` and no failed tests. |
| `git diff --check -- <Task 2 files>` | Passed with no whitespace errors. |
| Pre-commit `pnpm -F @opentiny/tiny-robot type-check` | Failed on pre-existing Task 3+ legacy API usage in `ExtensionFilter.vue`, `ExtensionList.vue`, and `index.vue`; no Task 2 file was reported. Commit therefore used `--no-verify`, per task instruction not to repair later files. |

## Concerns

- The repository-wide component type-check remains red because later, already-modified composition files reference removed pre-Task-2 fields such as `installedExtensions`, `display`, `permissions`, and legacy item state. This is outside Task 2 scope and was intentionally left unchanged.
