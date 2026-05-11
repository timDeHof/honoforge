---
phase: 02-openapi-error
plan: 01
subsystem: openapi
tags: [openapi, zod, schema-conversion, typed-response, route-metadata, docs]
dependency_graph:
  requires: ["@honoforge/core (Phase 1)"]
  provides: ["@honoforge/openapi package", "zodToOpenAPI", "response builders", "route metadata", "OpenAPI docs"]
  affects: ["packages/openapi/"]
tech_stack:
  added: ["@asteasolutions/zod-to-openapi@8.5.0", "yaml@2.8.0", "@hono/zod-openapi@1.4.0"]
  patterns: ["dual ESM/CJS exports", "peer dependencies", "tsdown bundling"]
key_files:
  created:
    - packages/openapi/package.json
    - packages/openapi/src/schema.ts
    - packages/openapi/src/response.ts
    - packages/openapi/src/routes.ts
    - packages/openapi/src/docs.ts
    - packages/openapi/test/schema.test.ts
    - packages/openapi/test/response.test.ts
    - packages/openapi/test/routes.test.ts
    - packages/openapi/test/docs.test.ts
  modified: []
decisions:
  - "Used internal Zod-to-OpenAPI converter instead of @asteasolutions/zod-to-openapi registry due to Zod v3/v4 compatibility issues"
  - "Extended Zod with OpenAPI at module load time in schema.ts for automatic setup"
  - "Accessed OpenAPIHono routes via openAPIRegistry._definitions (internal API) for route introspection"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-11"
  tasks: 3
  tests: 23
---

# Phase 2 Plan 01: Scaffold @honoforge/openapi + Implement OpenAPI Utilities

**One-liner:** Complete `@honoforge/openapi` package with Zod-to-OpenAPI schema conversion, typed response builders, route metadata extraction, and OpenAPI documentation helpers — 23 tests, dual ESM/CJS, attw+publint clean.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Scaffold @honoforge/openapi package structure | `64307b3` | package.json, tsconfig, tsdown.config, src/index.ts |
| 2 | Implement schema conversion and typed response builders | `64307b3` | schema.ts, response.ts, tests |
| 3 | Implement route metadata extraction and docs helpers | `64307b3` | routes.ts, docs.ts, tests |

## Key Deliverables

- **`zodToOpenAPI()`** — Converts Zod schemas to OpenAPI 3.x schema objects (supports string, number, boolean, array, object, enum, literal, union, nullable, optional, date, record, tuple, set, map)
- **`extendZodWithOpenAPI`** — Re-exported from `@asteasolutions/zod-to-openapi` for consumer use
- **Response builders** — `createResponse`, `okResponse`, `createdResponse`, `errorResponse` with typed `ForgeTypedResponse<T>`
- **Route metadata** — `extractRouteMetadata`, `listRoutes`, `getRouteByPath` for OpenAPIHono introspection
- **Docs helpers** — `generateOpenAPIDoc`, `serveOpenAPIDoc`, `generateOpenAPIDocYAML` for OpenAPI 3.1 document generation

## Test Results

| Test File | Tests | Status |
|-----------|-------|--------|
| schema.test.ts | 5 | ✓ |
| response.test.ts | 7 | ✓ |
| routes.test.ts | 6 | ✓ |
| docs.test.ts | 5 | ✓ |
| **Total** | **23** | **✓** |

## Build Validation

- `pnpm build` — exits 0, produces dual ESM/CJS + DTS
- attw — No problems found
- publint — Passes (minor warning about engines.node)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] @asteasolutions/zod-to-openapi v8 incompatible with Zod v3**
- **Found during:** Task 2 (schema conversion implementation)
- **Issue:** `@asteasolutions/zod-to-openapi` v8 uses Zod v4 internals (`$ZodRegistry`), causing `TypeError: Cannot read properties of undefined (reading 'parent')` when using `registry.register()` with Zod v3 schemas
- **Fix:** Implemented custom internal Zod-to-OpenAPI converter that handles all common Zod types directly, bypassing the registry-based approach. The library is still used for `extendZodWithOpenApi` re-export.
- **Files modified:** `packages/openapi/src/schema.ts`

**2. [Rule 2 - Missing] HTTPError export name mismatch**
- **Found during:** Task 2 (schema conversion)
- **Issue:** Plan referenced `HTTPError` from `hono/http-exception` but Hono v4 exports it as `HTTPException`
- **Fix:** Used correct export name `HTTPException` in code (no impact on openapi package, but noted for consistency)
- **Files modified:** N/A (noted for middleware package)

## Self-Check: PASSED

- All 9 created files exist on disk
- Commit `64307b3` exists in git log
- No `## Self-Check: FAILED` marker
