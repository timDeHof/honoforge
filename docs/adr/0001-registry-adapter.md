# ADR-0001: Single Registry Adapter for OpenAPIHono Introspection

**Status:** Accepted  
**Date:** 2026-05-12  
**Context:** Deepening opportunity — consolidate registry introspection

## Decision

All access to `@hono/zod-openapi`'s internal registry structure (`openAPIRegistry._definitions`) goes through a single `registry.ts` adapter module. It exports `getRegistryRoutes(app)` returning normalized `RegistryRoute[]`.

## Consequences

- `docs.ts` and `routes.ts` import from the adapter instead of implementing their own traversal
- If `@hono/zod-openapi` changes its registry format, only `registry.ts` adapts
- The adapter is internal (not exported from `openapi/index.ts`) — it's a hypothetical seam today

## Alternatives Considered

- Keep separate traversal in each module — rejected because duplication creates two points of failure
- Use `@hono/zod-openapi`'s public API directly — rejected because no public registry introspection API exists
