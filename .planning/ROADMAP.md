# ROADMAP — honoforge

## Project: honoforge

**Core Value:** Ship type-safe Hono APIs with zero runtime overhead.
**Granularity:** standard
**Mode:** yolo
**Parallelization:** enabled

## Phases

- [x] **Phase 1: Foundation & Core Package** — Establish `@honoforge/core` with proper package conventions, migrate HTTP status utilities, and create shared type infrastructure.
- [x] **Phase 2: OpenAPI Utilities & Error Handling** — Build `@honoforge/openapi` and `@honoforge/middleware` (error handling) packages that integrate with `@hono/zod-openapi`.

## Phase Details

### Phase 1: Foundation & Core Package

**Goal:** Establish `@honoforge/core` with proper package conventions, migrate existing HTTP status utilities, and create shared type infrastructure.

**Depends on:** Nothing (first phase)

**Requirements:** CORE-01, CORE-02, CORE-03, CORE-04

**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md — Scaffold @honoforge/core package with monorepo structure, peer deps, build pipeline
- [x] 01-02-PLAN.md — Migrate HTTP status codes and phrases with tests
- [x] 01-03-PLAN.md — Create ForgeEnv, ForgeMiddlewareHandler types and ForgeStorage interface

**Success Criteria** (what must be TRUE):
1. `@honoforge/core` publishes to npm with correct peer deps, dual ESM/CJS exports, and type declarations (verified by `attw` + `publint`)
2. HTTP status codes and phrases are importable and type-safe (verified by tests)
3. `ForgeEnv` and `ForgeMiddlewareHandler` types work with Hono's type inference — middleware variables flow into handlers without `BlankEnv`
4. Storage adapter interface (`ForgeStorage` with get, set, delete, ttl) is usable by future middleware — rate limiter, cache, and idempotency can implement it


### Phase 2: OpenAPI Utilities & Error Handling

**Goal:** Build `@honoforge/openapi` and `@honoforge/middleware` (error handling) packages that integrate with `@hono/zod-openapi`.

**Depends on:** Phase 1

**Requirements:** OPENAPI-01, OPENAPI-02, OPENAPI-03, OPENAPI-04, ERR-01, ERR-02

**Plans:** 3 plans in 2 waves

Plans:
- [x] 02-01-PLAN.md — Scaffold @honoforge/openapi + implement schema conversion, typed responses, route metadata, and docs helpers
- [x] 02-02-PLAN.md — Scaffold @honoforge/middleware + implement RFC 9457 error handler and error formatting utilities
- [x] 02-03-PLAN.md — Cross-runtime verification and full build/test suite for both packages

**Wave Structure:**
- **Wave 1** (parallel): 02-01, 02-02
- **Wave 2** (blocked on Wave 1): 02-03

**Success Criteria** (what must be TRUE):
1. Zod schemas convert to valid OpenAPI 3.x schema objects (verified against OpenAPI spec)
2. Typed response builders return correctly typed responses with status codes that match OpenAPI metadata
3. Route metadata extraction works on `OpenAPIHono` instances — can list routes and extract schemas
4. Error handler middleware catches unhandled errors and returns valid RFC 9457 Problem Details responses (`application/problem+json`)
5. All packages pass cross-runtime CI (Node.js, Bun, Cloudflare Workers)

## Phase Ordering Rationale

Phase 1 must come first because:
- Package conventions (peer deps, tsdown config, CI) are the hardest to change later — 8 pitfalls map here
- `@honoforge/core` types (`ForgeEnv`, `ForgeMiddlewareHandler`) are dependencies for all other packages
- Storage adapter interface is needed by future middleware but is designed in Phase 1

Phase 2 can build OpenAPI and error handling in parallel because:
- `@honoforge/openapi` depends only on `@honoforge/core`
- `@honoforge/middleware` (error handling) depends only on `@honoforge/core`
- No inter-dependencies between the two packages

## Coverage Validation

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORE-01 | Phase 1 | ✓ Complete |
| CORE-02 | Phase 1 | ✓ Complete |
| CORE-03 | Phase 1 | ✓ Complete |
| CORE-04 | Phase 1 | ✓ Complete |
| OPENAPI-01 | Phase 2 | ✓ Complete |
| OPENAPI-02 | Phase 2 | ✓ Complete |
| OPENAPI-03 | Phase 2 | ✓ Complete |
| OPENAPI-04 | Phase 2 | ✓ Complete |
| ERR-01 | Phase 2 | ✓ Complete |
| ERR-02 | Phase 2 | ✓ Complete |

**Total v1 requirements:** 10
**Mapped:** 10 (100%)
**Unmapped:** 0

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Core Package | 3/3 | ✓ Complete | Wave 1: 01-01, 01-02 | Wave 2: 01-03 |
| 2. OpenAPI Utilities & Error Handling | 3/3 | ✓ Complete | Wave 1: 02-01, 02-02 | Wave 2: 02-03 |
