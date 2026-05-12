---
phase: 2
phase_name: "OpenAPI Utilities & Error Handling"
project: "honoforge"
generated: "2026-05-12T00:12:00Z"
counts:
  decisions: 7
  lessons: 4
  patterns: 4
  surprises: 2
missing_artifacts:
  - "UAT.md"
---

# Phase 2 Learnings: OpenAPI Utilities & Error Handling

## Decisions

### Custom Zod-to-OpenAPI converter

`@asteasolutions/zod-to-openapi` v8 incompatible with Zod v3 internals. Implemented custom recursive converter handling 25+ Zod types directly.

**Rationale:** The library's registry-based approach uses Zod v4 internals (`$ZodRegistry`), causing `TypeError: Cannot read properties of undefined (reading 'parent')` with Zod v3 schemas. The custom converter bypasses the registry entirely.
**Source:** 02-01-SUMMARY.md

---

### Extended Zod with OpenAPI at module load time

`extendZodWithOpenApi(z)` called in schema.ts for automatic setup.

**Rationale:** Ensures Zod schemas are OpenAPI-aware before any conversion happens, enabling `.openapi()` metadata on schemas.
**Source:** 02-01-SUMMARY.md

---

### Accessed OpenAPIHono routes via `openAPIRegistry._definitions`

Internal API used for route introspection.

**Rationale:** No public API exists for extracting route metadata from OpenAPIHono instances. The internal `_definitions` array contains all registered route configurations.
**Source:** 02-01-SUMMARY.md

---

### Used `app.onError()` pattern for global error handling

Hono v4 requires `app.onError()` for reliable global error capture, not middleware try/catch.

**Rationale:** Middleware try/catch doesn't override Hono v4's built-in error handler — responses are returned as plain text instead of JSON. `app.onError()` is the correct pattern.
**Source:** 02-02-SUMMARY.md

---

### Created both `errorHandler()` and `createErrorHandler()`

Middleware factory and ErrorHandler factory for flexibility.

**Rationale:** `errorHandler()` provides middleware-style usage for route-specific handling; `createErrorHandler()` returns an ErrorHandler function for `app.onError()` global handling.
**Source:** 02-02-SUMMARY.md

---

### Internal STATUS_PHRASES mapping

`HttpPhrase` from `@honoforge/core` exports named constants not numeric keys, so created internal mapping.

**Rationale:** Named constants like `BAD_REQUEST` can't be looked up by numeric status code. An internal `Record<number, string>` mapping provides the needed lookup.
**Source:** 02-02-SUMMARY.md

---

### Cross-runtime tests focus on importability

Full behavior tested in per-feature test files; cross-runtime tests verify basic execution.

**Rationale:** Cross-runtime tests (Node.js, Bun, Cloudflare Workers) should be lightweight — verifying that all exports are importable and don't throw at runtime.
**Source:** 02-03-SUMMARY.md

---

## Lessons

### `@asteasolutions/zod-to-openapi` v8 incompatible with Zod v3

Registry-based approach uses Zod v4 internals (`$ZodRegistry`), causing `TypeError` with Zod v3 schemas. Custom converter was the fix.

**Context:** Discovered during Task 2 (schema conversion implementation). The plan assumed the library would work with Zod v3, but v8 broke compatibility.
**Source:** 02-01-SUMMARY.md

---

### Hono v4 exports `HTTPException` not `HTTPError`

Plan referenced wrong export name; all imports needed updating.

**Context:** Found during both openapi and middleware implementation. The plan used `HTTPError` but Hono v4 exports `HTTPException` from `hono/http-exception`.
**Source:** 02-01-SUMMARY.md, 02-02-SUMMARY.md

---

### Middleware try/catch doesn't override Hono v4 error handler

Responses returned as plain text instead of JSON. The correct pattern is `app.onError()` with an ErrorHandler function.

**Context:** Discovered during error handler middleware tests. Hono v4's built-in error handler takes precedence over middleware-level try/catch.
**Source:** 02-02-SUMMARY.md

---

### Named constants can't be used as numeric lookup

`HttpPhrase` from `@honoforge/core` exports named constants (e.g., `BAD_REQUEST`), not numeric keys, so `(HttpPhrase as Record<number, string>)[status]` returns undefined.

**Context:** Found during formatProblemDetails implementation. The plan assumed numeric lookup was available but the export shape was different.
**Source:** 02-02-SUMMARY.md

---

## Patterns

### Dual ESM/CJS package pattern

Consistent across all packages: tsdown with `format: ['cjs', 'esm']`, `dts: true`, attw + publint validation.

**When to use:** Every package in the honoforge monorepo should follow this pattern for maximum compatibility.
**Source:** 02-01-SUMMARY.md, 02-02-SUMMARY.md

---

### Factory pattern for Hono handlers

Both `errorHandler()` (middleware) and `createErrorHandler()` (ErrorHandler factory) provide flexibility for different use cases.

**When to use:** When a Hono utility needs to support both `app.use()` (middleware) and `app.onError()` (error handler) patterns.
**Source:** 02-02-SUMMARY.md

---

### RFC 9457 Problem Details structure

`type`, `title`, `status`, `detail`, `instance` with extension members, served as `application/problem+json`.

**When to use:** Any error response in a Hono API should follow this standard for consistency and interoperability.
**Source:** 02-02-SUMMARY.md

---

### Internal registry access for introspection

Accessing `openAPIRegistry._definitions` enables route metadata extraction without public API support.

**When to use:** When you need to introspect registered routes on an OpenAPIHono instance and no public API exists.
**Source:** 02-01-SUMMARY.md

---

## Surprises

### Zod v3/v4 compatibility gap

`@asteasolutions/zod-to-openapi` v8's breaking change with Zod v3 internals was unexpected and required a full custom converter implementation.

**Impact:** Added ~179 lines of custom conversion code to handle 25+ Zod types. The library is still used for `extendZodWithOpenApi` re-export but not for schema conversion.
**Source:** 02-01-SUMMARY.md

---

### Hono v4 error handling behavior change

Middleware try/catch pattern from plans didn't work as expected; Hono v4's built-in error handler takes precedence.

**Impact:** Required creating a separate `createErrorHandler()` factory and updating the recommended usage pattern from `app.use('*', errorHandler())` to `app.onError(createErrorHandler())`.
**Source:** 02-02-SUMMARY.md
