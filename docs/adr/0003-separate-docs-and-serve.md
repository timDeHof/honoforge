# ADR-0003: Separate OpenAPI Document Generation from HTTP Serving

**Status:** Accepted  
**Date:** 2026-05-12  
**Context:** Deepening opportunity — separate concerns in docs.ts

## Decision

`serveOpenAPIDoc` lives in its own `serve.ts` module. `docs.ts` contains only pure document generation functions (`generateOpenAPIDoc`, `generateOpenAPIDocYAML`).

## Consequences

- `docs.ts` is pure — testable without HTTP context
- `serve.ts` owns HTTP serving concerns (path matching, content type, response)
- Both modules re-exported from `openapi/index.ts`

## Alternatives Considered

- Keep combined in `docs.ts` — rejected because it coupled generation (pure) with serving (HTTP side effects)
- Integrate with Hono routing instead of manual path matching — deferred; current implementation is sufficient for the use case
