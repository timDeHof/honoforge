---
phase: 1
phase_name: "Foundation & Core Package"
project: "honoforge"
generated: "2026-05-12T00:12:00Z"
counts:
  decisions: 5
  lessons: 2
  patterns: 3
  surprises: 0
missing_artifacts:
  - "VERIFICATION.md"
  - "UAT.md"
---

# Phase 1 Learnings: Foundation & Core Package

## Decisions

### Exports use `.mjs`/`.cjs` extensions

tsdown's default output format uses `.mjs`/`.cjs` extensions; package.json exports were aligned accordingly.

**Rationale:** Follow tsdown conventions for correct module resolution.
**Source:** 01-01-SUMMARY.md

---

### Installed `@arethetypeswrong/core`

Required dependency for attw (Are The Types Wrong) validation in tsdown config.

**Rationale:** attw validation catches type declaration issues before publishing.
**Source:** 01-01-SUMMARY.md

---

### Namespace re-exports in index.ts

Changed from `export * from './http-status-codes.js'` to `export * as HttpStatusCode from './http-status-codes.js'` to resolve TypeScript name collision.

**Rationale:** Both codes and phrases export the same constant names (`OK`, `NOT_FOUND`, etc.). Namespace re-exports prevent conflicts while preserving access via `HttpStatusCode.OK` and `HttpPhrase.OK`.
**Source:** 01-03-SUMMARY.md

---

### ForgeEnv uses `type` not `interface`

Required by Hono v4 type system for proper generic intersection support.

**Rationale:** Hono v4 requires `type` declarations for Env generics to work correctly with intersection types. Using `interface` causes type leakage.
**Source:** 01-03-SUMMARY.md

---

### ForgeStorage is interface-only

Implementations (Redis, KV, Memory) deferred to downstream phases.

**Rationale:** Phase 1 establishes the contract; implementations are built when middleware (rate limiter, cache, idempotency) needs them.
**Source:** 01-03-SUMMARY.md

---

## Lessons

### Stub files needed for build pipeline verification

Minimal stubs for types.ts, storage.ts, http-status-codes.ts, http-status-phrases.ts were created so the build pipeline could verify before actual content was populated by downstream plans.

**Context:** The barrel export contract in index.ts references files that don't exist yet. Stub files with minimal exports allow tsdown to complete the build.
**Source:** 01-01-SUMMARY.md

---

### Name collisions in barrel exports

When two modules export the same constant names (e.g., `OK`, `NOT_FOUND`), namespace re-exports (`export * as X from`) are required to avoid TypeScript conflicts.

**Context:** HTTP status codes and phrases both export constants with identical names. Direct `export *` from both causes duplicate identifier errors.
**Source:** 01-03-SUMMARY.md

---

## Patterns

### @hono/\* package structure pattern

Dual ESM/CJS exports with `.mjs`/`.cjs` extensions, peer deps on hono, provenance-enabled publishConfig, attw + publint in tsdown config.

**When to use:** Scaffolding any new package in the honoforge monorepo.
**Source:** 01-01-PLAN.md, 01-01-SUMMARY.md

---

### Barrel export contract pattern

Declare all exports in index.ts upfront, even before source files exist. TypeScript/tsdown resolves them once downstream plans create the files.

**When to use:** Multi-plan phases where source files are created in later plans but the export contract needs to be established early.
**Source:** 01-01-PLAN.md

---

### Type-level testing with vitest

Use `expectTypeOf` for compile-time type verification alongside runtime tests.

**When to use:** Testing type infrastructure like ForgeEnv, ForgeMiddlewareHandler, ExtendContext — verifying type behavior at compile time rather than runtime.
**Source:** 01-03-PLAN.md

---

## Surprises

_No surprises documented for this phase._
