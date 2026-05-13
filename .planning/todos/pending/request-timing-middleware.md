---
title: "Implement request timing middleware"
date: 2026-05-12
priority: medium
status: pending
---

## Description

Create middleware that measures request duration and attaches `X-Response-Time` header. Uses `Date.now()` for cross-runtime compatibility.

## Research Findings

- `Date.now()` is the Hono standard — `performance.now()` for sub-ms precision, avoid `process.hrtime()` (breaks edge)
- Standard pattern: `const start = Date.now(); await next(); set header`
- Place first in middleware chain (outermost) to capture full pipeline duration
- Both header AND log is the standard pattern
- Correlates with request IDs via `c.set()` / context
- For production observability, `@hono/otel` exists but that's separate

## Requirements

- Measures request duration using `Date.now()`
- Sets `X-Response-Time` header on response (e.g., `"12.34ms"`)
- Optional: accepts a logging callback for server-side observability
- Zero dependencies

## Acceptance Criteria

- [ ] `createTimingMiddleware(options?)` factory function
- [ ] Sets `X-Response-Time` header with format like `"12.34ms"`
- [ ] Optional `onResponse` callback receives `{ elapsedMs, path, method }`
- [ ] Works on Cloudflare Workers, Bun, Deno, Node.js
- [ ] Tests verify header is set and timing is reasonable
- [ ] Exported from `src/middleware/index.ts`

## Notes

- Should be placed first in middleware chain for accurate full-pipeline timing
- Consider whether to include timing in Problem Details responses as an extension field
