---
title: "Implement request ID middleware"
date: 2026-05-12
priority: high
status: pending
---

## Description

Wrap or augment Hono's built-in `requestId()` middleware to ensure request IDs flow through the entire pipeline, including Problem Details error responses.

## Research Findings

- Hono already has `requestId()` in `hono/request-id` — uses `crypto.randomUUID()`, works on all edge runtimes
- Accepts incoming `X-Request-ID` headers by default (disable with `headerName: ""`)
- Stores ID via `c.set('requestId', ...)` — error handler can extract via `c.get('requestId')`
- Stick with UUID v4 — ULID/nanoid add dependencies with no real benefit unless sortability needed
- Platform-specific IDs (Lambda `awsRequestId`, CF `cf.rayId`) can be captured via custom `generator` function

## Requirements

- Re-export or wrap Hono's `requestId()` middleware
- Ensure error handler includes `requestId` in Problem Details `extensions` field
- Typed for `ForgeEnv` with proper variable inference
- Zero additional dependencies

## Acceptance Criteria

- [ ] `createRequestIdMiddleware()` or re-export of Hono's `requestId()`
- [ ] Error handler includes `requestId` in Problem Details extensions
- [ ] Tests verify request ID appears in error responses
- [ ] Works on Cloudflare Workers, Bun, Deno, Node.js
- [ ] Exported from `src/middleware/index.ts`

## Notes

- May not need a wrapper if Hono's built-in is sufficient — verify first
- The real work is ensuring the error handler picks up the ID from context
