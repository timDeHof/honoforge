---
title: "Implement rate limiter middleware"
date: 2026-05-12
priority: medium
status: pending
---

## Description

Create a rate limiting middleware using the existing `ForgeStorage` interface with TTL support. Implements Fixed Window Counter algorithm for KV compatibility.

## Research Findings

- **Fixed Window Counter** wins for KV + TTL — simplest: `key = rl:{id}:{window}`, value = count, TTL = window duration
- Tradeoff: allows 2× burst at window boundaries (acceptable for most use cases)
- **Sliding Window Counter** is the accuracy upgrade — 2 KV reads + 1 write, weighs previous window by overlap
- Skip token bucket and sliding window log — too chatty for KV's eventual consistency
- Cloudflare's built-in rate limiting is eventually consistent — good for abuse prevention, bad for strict quotas
- The `ForgeStorage` interface is already the right abstraction

## Requirements

- Factory function accepting:
  - `storage: ForgeStorage` instance
  - `limit: number` — max requests per window
  - `windowMs: number` — window duration in milliseconds
  - `keyGenerator: (c) => string` — defaults to IP address
- Returns 429 Problem Details response when limit exceeded
- Includes `Retry-After` header and rate limit info in response headers
- Typed for `ForgeEnv`

## Acceptance Criteria

- [ ] `createRateLimiterMiddleware(options)` factory function
- [ ] Fixed Window Counter algorithm using ForgeStorage
- [ ] Returns 429 with Problem Details when limit exceeded
- [ ] Sets `Retry-After` header on 429 responses
- [ ] Sets `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers
- [ ] Configurable key generator (IP, API key, user ID, etc.)
- [ ] Tests cover: within limit, at limit, over limit, window reset
- [ ] Exported from `src/middleware/index.ts`

## Notes

- Start with Fixed Window Counter — can add Sliding Window Counter as an option later
- The ForgeStorage interface already supports TTL, which is the key requirement
- Consider whether to do async storage operations — most ForgeStorage implementations will be async
