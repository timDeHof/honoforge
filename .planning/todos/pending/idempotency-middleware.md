---
title: "Implement idempotency middleware"
date: 2026-05-12
priority: high
status: pending
---

## Description

Create an opt-in idempotency middleware that caches responses for requests with an `Idempotency-Key` header. Provides a drop-in safety net for POST/PUT/PATCH/DELETE endpoints.

## Design Decisions

- **Opt-in** — Only applies when client sends `Idempotency-Key` header (Stripe standard)
- **Cached response replay** — Duplicate key returns the exact cached response (same status, body, headers) without re-executing the handler
- **Fail open** — If storage is unavailable, request proceeds normally (no blocking on storage failures)
- **TTL: 24 hours** — Long enough for retries, short enough to not waste storage
- **Methods: POST, PUT, PATCH, DELETE** — GET requests pass through untouched

## Requirements

- Factory function accepting:
  - `storage: ForgeStorage` instance
  - `ttlMs: number` — cache TTL, default 86400000 (24h)
  - `methods: string[]` — which methods to apply, default `['POST', 'PUT', 'PATCH', 'DELETE']`
  - `headerName: string` — idempotency key header, default `Idempotency-Key`
- On first request: process normally, cache `{ status, body, headers }`, return response
- On duplicate key: return cached response without executing handler
- Sets `Idempotency-Key: <key>` on response so client knows it was processed
- Uses `ForgeStorage` with TTL — leverages existing abstraction
- Zero additional dependencies

## Acceptance Criteria

- [ ] `createIdempotencyMiddleware(options)` factory function
- [ ] Opt-in behavior — only activates when `Idempotency-Key` header present
- [ ] Caches and replays full response (status, body, headers)
- [ ] Sets `Idempotency-Key` on response headers
- [ ] Fails open when storage is unavailable
- [ ] Skips GET/OPTIONS/HEAD requests
- [ ] Configurable TTL, methods, and header name
- [ ] Tests cover: first request, duplicate request, expired key, storage failure, GET passthrough
- [ ] Exported from `src/middleware/index.ts`

## Notes

- Junior-friendly mental model: "Same key = same response, no re-execution"
- Response body needs to be captured before it's consumed — may need to clone the response stream
- Consider whether to cache only successful responses (2xx) or all responses including errors
- The ForgeStorage interface already supports TTL, which is the key requirement
