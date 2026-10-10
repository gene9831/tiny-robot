# Public API Documentation Standard

This standard applies to every declaration exported from a published Tiny Robot package. Public documentation is part of the API contract: it must explain consumer-visible behavior without exposing or promising implementation details.

This file governs English symbol-level TSDoc. Chinese concept explanations,
diagrams, scenarios, and review drafts live in the separate
[`docs-next`](../../docs-next/src/index.md) project and follow its
[documentation completeness standard](../../docs-next/src/contributing/documentation-standard.md).

## Format

- Use English TSDoc comments beginning with `/**` so TypeScript editors and TypeDoc discover the same documentation.
- Start every public declaration, property, and method with a short summary sentence.
- Use `@remarks` only when lifecycle, ordering, concurrency, security, or compatibility details do not fit in the summary.
- Use `@param` for each non-obvious parameter, `@returns` when the return contract is not self-evident, and `@throws` for synchronous errors or documented Promise rejection conditions.
- Use `{@link SymbolName}` for public symbol references. Every link must resolve during `docs:check`.
- Add `@example` only when a realistic example prevents a likely consumer error.

## Required content

Document information the TypeScript signature cannot express:

- the declaration's positive responsibility, intended consumer, and observable result;
- for capability or verification claims, the responsible producer, supporting evidence, and consumer decision;
- domain meaning and ownership;
- identifier scope and relationships;
- lifecycle and allowed state transitions;
- ordering, concurrency, subscription, and cleanup behavior;
- the meaning of an omitted optional property;
- units, defaults, limits, normalization, and loss of information;
- error, abort, retry, and Promise rejection semantics;
- security and persistence restrictions.

Security requirements use unambiguous normative wording such as **must** and **must not**. Credentials, authorization material, provider headers, raw payloads, raw chunks, unsanitized errors, and provider metadata must never be described as safe to persist or expose through Runtime domain APIs.

## Avoid

- Do not define a declaration primarily through adjectives such as “serializable,” “immutable,” or “safe.” State what responsibility it fulfills before describing representation or constraints.
- Do not answer a missing responsibility by adding more “does not” or “must not” statements. Negative constraints may clarify a specific risk, but they do not replace a positive contract.
- Do not restate syntax, such as “The ID” for `id: string` or “Whether retryable” for `retryable: boolean`.
- Do not document private implementation steps, internal call order, SDK objects, or Provider wire formats on Runtime domain types.
- Do not promise unapproved behavior or broaden a capability beyond the approved contract.
- Describe the currently supported contract, not the sequence of edits that produced it. Once a public name or field is fully removed and has no compatibility period, remove it from TSDoc and generated API documentation instead of explaining its removal.
- Protect the resulting API with positive contract checks, such as the complete allowed key set, rather than a regression named after one retired field.
- Do not use comments to hide a confusing public API. Escalate a contract problem for review instead.
- Do not describe a caller- or extension-supplied label as independently verified unless the system actually verifies it. If the consumer cannot enforce the claim and the field only repeats an upstream admission responsibility, escalate whether the field belongs in the public API.
- Do not copy the same paragraph onto several members; link to the owning concept when possible.

## Stability tags

- Unmarked published declarations are public and stable within their documented contract.
- Use `@beta` or `@experimental` only after the package's release policy defines the corresponding compatibility promise.
- Use `@deprecated` with the replacement API and migration direction. Do not remove the old declaration merely because it is marked deprecated.
- Use `@internal` only for declarations that are excluded from the published entry point.

## Verification

Run the documentation gate from the repository root:

```sh
pnpm -F @opentiny/tiny-robot-runtime docs:check
```

The command must finish without warnings. It validates the public entry point without writing generated files. To preview the generated HTML locally, run:

```sh
pnpm -F @opentiny/tiny-robot-runtime docs:build
```

Generated HTML is a build artifact and is not committed unless the documentation publishing workflow explicitly adopts it.
The Runtime TypeDoc build writes directly to the ignored
`docs-next/src/public/api/runtime/` directory so the standalone documentation
site remains the only local preview location.

When a public name is fully removed, search source, tests, hand-written documentation, and regenerated output for that exact retired identifier. Any remaining occurrence needs an explicit compatibility, migration, or historical-documentation reason.
