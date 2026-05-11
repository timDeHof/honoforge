---
phase: 02-openapi-error
plan: 02
subsystem: middleware
tags: [error-handling, rfc-9457, problem-details, middleware]
dependency_graph:
  requires: ["@honoforge/core (Phase 1)"]
  provides: ["@honoforge/middleware package", "errorHandler", "formatError", "formatHTTPError", "formatProblemDetails"]
  affects: ["packages/middleware/"]
tech_stack:
  added: []
  patterns: ["dual ESM/CJS exports", "peer dependencies", "tsdown bundling", "factory pattern"]
key_files:
  created:
    - packages/middleware/package.json
    - packages/middleware/src/error-types.ts
    - packages/middleware/src/error-formatter.ts
    - packages/middleware/src/error-handler.ts
    - packages/middleware/test/error-formatter.test.ts
    - packages/middleware/test/error-handler.test.ts
  modified: []
decisions:
  - "Used Hono's app.onError() pattern instead of middleware try/catch for reliable error capture (Hono v4 behavior)"
  - "Created both errorHandler() middleware and createErrorHandler() factory for flexibility"
  - "Used internal status-to-phrase mapping instead of HttpPhrase namespace (numeric lookup not available)"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-11"
  tasks: 2
  tests: 17
---

# Phase 2 Plan 02: Scaffold @honoforge/middleware + RFC 9457 Error Handler

**One-liner:** Complete `@honoforge/middleware` package with RFC 9457 Problem Details error handler middleware and error formatting utilities — 17 tests, dual ESM/CJS, attw+publint clean.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Scaffold @honoforge/middleware package structure | `03a092b` | package.json, tsconfig, tsdown.config, error-types.ts, src/index.ts |
| 2 | Implement error handler middleware and error formatting utilities | `03a092b` | error-formatter.ts, error-handler.ts, tests |

## Key Deliverables

- **`ProblemDetails` type** — RFC 9457 compliant type with `type`, `title`, `status`, `detail`, `instance`, and extension members
- **`formatError()`** — Universal error formatter handling Error, HTTPException, objects with status, strings, and unknown types
- **`formatHTTPError()`** — Specialized formatter for Hono's HTTPException
- **`formatProblemDetails()`** — Low-level builder with defaults (type: "about:blank", title from status phrase)
- **`errorHandler()`** — Middleware factory for route-specific error handling
- **`createErrorHandler()`** — ErrorHandler factory for `app.onError()` pattern (recommended for global error handling)
- **Production mode** — Optional `isProduction` flag sanitizes 5xx error details

## Test Results

| Test File | Tests | Status |
|-----------|-------|--------|
| error-formatter.test.ts | 11 | ✓ |
| error-handler.test.ts | 6 | ✓ |
| **Total** | **17** | **✓** |

## Build Validation

- `pnpm build` — exits 0, produces dual ESM/CJS + DTS
- attw — No problems found
- publint — Passes (minor warning about engines.node)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] HTTPError vs HTTPException export name**
- **Found during:** Task 2 (error formatter implementation)
- **Issue:** Plan referenced `HTTPError` from `hono/http-exception` but Hono v4 exports it as `HTTPException`
- **Fix:** Used `HTTPException` in all imports and code
- **Files modified:** `packages/middleware/src/error-formatter.ts`, test files

**2. [Rule 1 - Bug] Hono v4 middleware error handling behavior**
- **Found during:** Task 2 (error handler middleware tests)
- **Issue:** Middleware try/catch pattern from plan doesn't override Hono v4's built-in error handler — responses returned as plain text instead of JSON
- **Fix:** Created `createErrorHandler()` factory that returns an `ErrorHandler` function for use with `app.onError()`. This is the correct Hono v4 pattern for global error handling. Kept `errorHandler()` middleware export for API compatibility.
- **Files modified:** `packages/middleware/src/error-handler.ts`, test files

**3. [Rule 2 - Missing] HttpPhrase numeric lookup not available**
- **Found during:** Task 2 (formatProblemDetails implementation)
- **Issue:** `HttpPhrase` from `@honoforge/core` exports named constants (e.g., `BAD_REQUEST`) not numeric keys, so `(HttpPhrase as Record<number, string>)[status]` returns undefined
- **Fix:** Created internal `STATUS_PHRASES` mapping object with common HTTP status codes and their phrases
- **Files modified:** `packages/middleware/src/error-formatter.ts`

## Self-Check: PASSED

- All 6 created files exist on disk
- Commit `03a092b` exists in git log
- No `## Self-Check: FAILED` marker
