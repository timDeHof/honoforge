---
title: "Implement security headers middleware"
date: 2026-05-12
priority: medium
status: pending
---

## Description

Create a middleware that sets essential security headers for API responses. Focused on APIs (not SPAs) — skip CSP, X-Frame-Options, COOP/COEP which are irrelevant for JSON APIs.

## Research Findings

- **Essential 5 headers for APIs:**
  - `X-Content-Type-Options: nosniff` — prevents MIME confusion attacks
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains` — forces HTTPS
  - `Cache-Control: no-store` (or `private`) — prevents sensitive data caching
  - Explicit `Content-Type` — never guessed
  - Strip `Server` and `X-Powered-By` — prevent fingerprinting
- **Skip:** `X-XSS-Protection` (actively harmful), `Expect-CT` (deprecated), `Public-Key-Pins` (removed)
- CORS is the real security boundary for APIs, not headers
- Hono implementation: global middleware for baseline, per-route overrides via `c.header()`

## Requirements

- Factory function accepting optional config to override defaults
- Sets baseline headers on every response
- Configurable per-header enable/disable
- Typed for `ForgeEnv`

## Acceptance Criteria

- [ ] `createSecurityHeadersMiddleware(config?)` factory function
- [ ] Sets all 5 essential headers by default
- [ ] Config allows disabling individual headers
- [ ] Strips `Server` and `X-Powered-By` headers
- [ ] Tests verify headers present in response
- [ ] Exported from `src/middleware/index.ts`

## Notes

- Keep config simple — boolean flags per header, not complex objects
- Consider a `preset: 'api' | 'spa'` option for future expansion
