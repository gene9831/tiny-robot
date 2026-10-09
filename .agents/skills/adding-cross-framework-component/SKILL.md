---
name: adding-cross-framework-component
description: Use when designing or implementing a new next-generation Tiny Robot UI component that must have behaviorally equivalent Vue 3.4+ and Angular 20+ renderers.
---

# Adding a cross-framework component

## Before changing code

Read `AGENTS.md`, `docs/contracts/components.md`, `docs/testing/strategy.md`, and the relevant terms in `CONTEXT.md`.

Do not infer a new component's product scope from a similarly named legacy Vue component. Record legacy behavior only as evidence. If supported behavior, package placement, public naming, or visual UX is unresolved, stop at a proposal and request the required human decision.

## Workflow

1. **Write the semantic boundary.** State the user job, included and excluded behavior, accessibility expectations, and the minimum View Model and semantic actions. Confirm that no Runtime, Provider, Storage, framework reactive type, or DOM type leaks into the shared contract.
2. **Classify every public input.** Put each concept in exactly one of `data`, `options`, `model`, `events`, `services`, or `templates`. For every `model`, state whether it is controlled, uncontrolled, or both; if both, define initialization and change-request semantics.
3. **Create a behavior matrix before renderer code.** Give stable scenario names and observable outcomes for normal interaction, disabled/loading states, keyboard and IME behavior, accessibility, customization scope, and cleanup. Mark which scenarios are automated and which require manual experience.
4. **Map native APIs.** Map each semantic concept separately to Vue props/`v-model`/events/slots and Angular input/model/output/`TemplateRef`/content projection. Equivalent behavior is required; identical spelling is not.
5. **Propose ownership and files.** Reuse the agreed UI contract, token, Web layer, and framework renderer boundaries. Creating or moving packages, adding production dependencies, or changing public exports is a human approval gate—do not treat it as an implementation detail.
6. **Implement test-first.** Add the smallest consumer-observable contract scenario, see it fail for the missing behavior, implement both renderers, and run the same semantic scenarios in both framework runners. Keep framework-only tests only for native lifecycle or integration behavior.
7. **Verify and document.** Run targeted type checks, component tests, accessibility checks, and consumer builds for both supported frameworks. Document the semantic contract and native usage; explicitly describe any intentional framework difference.

## Required handoff

Report:

- agreed scope and explicit deferrals;
- the input classification and controlled/uncontrolled decisions;
- the shared behavior scenarios and two renderer mappings;
- human-gated choices still awaiting approval;
- exact validation commands and results;
- manual experience checks still required.

Do not call the component complete when only one renderer passes, when the second renderer has weaker assertions, or when the implementation relies on a connected Runtime wrapper.
