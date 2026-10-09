---
name: adding-provider-adapter
description: Use when designing or implementing a Tiny Robot Provider integration that supplies a LanguageModelV4 model and must satisfy the pinned Runtime Boundary Contract.
---

# Adding a Provider Adapter

## Before changing code

Read `AGENTS.md`, `docs/architecture/overview.md`, `docs/contracts/runtime.md`, the pinned LanguageModelV4 Runtime Boundary Contract, and the target Provider's current official API documentation.

If the repository does not yet contain an approved boundary version, stream-part allowlist, ordering rules, capability descriptor and fixture requirements, stop at a mapping proposal. Do not invent Runtime input semantics inside a Provider integration.

## First classify the integration

- Prefer an existing AI SDK Provider that implements the approved `LanguageModelV4` specification and passes Tiny Robot conformance.
- Implement a custom `LanguageModelV4` Provider only when no maintained implementation exists or when a real protocol or capability difference cannot be represented safely.
- Keep network transport, Provider parsing, V4 mapping, Runtime Ingress Guard and Domain mapping separately testable even when some layers come from an external package.

Creating a package, adding a production dependency, changing public exports, changing the boundary contract, or widening persisted metadata is a human approval gate.

## Workflow

1. **Freeze scope.** Record Provider API/version, AI SDK package/version, browser-direct support, authentication mechanism, supported capabilities, explicit exclusions and every known loss.
2. **Build a mapping matrix.** For every supported request field and V4 stream part, name the Provider representation, ordering rule, ID rule, terminal condition, cancellation behavior and loss policy. Include unknown, malformed, truncated and non-2xx input.
3. **Define the security boundary.** Credentials are per-request transient inputs. Use a Run-local model factory. Never place secrets or raw headers in Run config, Snapshot, persistence, URLs, event payloads, adapter instances that outlive the Run, fixtures or errors.
4. **Create sanitized conformance fixtures first.** Test raw Provider fixture to V4 output separately from V4 fixture to Domain output. Cover exact stream order, text/tool assembly, termination, errors, cancellation, unknown events and secret isolation.
5. **Implement or configure the Provider.** Prefer the maintained Provider package. If custom conversion is required, keep parsing and mapping deterministic before connecting I/O and `AbortSignal`.
6. **Run integration checks.** Verify capability negotiation, Ingress Guard invariants, Snapshot results, terminal Run state, tool lifecycle, retry/error behavior, and abort before and during streaming.
7. **Document truthfully.** Publish the tested package/API versions, browser/CORS limitations, losses, errors, cancellation, BYOK risk and proxy alternative. Do not claim browser-direct support without a real-browser check.

## Required handoff

Report scope and exclusions, mapping matrix, capability declaration, security/redaction decisions, fixture provenance, Provider/Guard/Runtime results, dependency/package gates and manual live-provider tests still required.

An integration is not complete merely because a happy-path text stream renders. It must prove termination, cancellation, error, unknown-part behavior, secret isolation and declared tool behavior against the pinned boundary.
