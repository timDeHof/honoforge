---
title: "Idempotency middleware design decisions"
date: 2026-05-12
context: "Exploration of honoforge middleware handlers"
---

## Idempotency Middleware

### Decisions Made

| Decision           | Choice                                           | Rationale                                       |
| ------------------ | ------------------------------------------------ | ----------------------------------------------- |
| Activation         | Opt-in (requires `Idempotency-Key` header)       | Stripe standard, explicit, no surprises         |
| Duplicate behavior | Return cached response (status + body + headers) | Simplest mental model: "same key = same answer" |
| Storage failure    | Fail open (proceed normally)                     | Don't block requests on storage issues          |
| TTL                | 24 hours                                         | Covers retry windows without hoarding storage   |
| Methods            | POST, PUT, PATCH, DELETE only                    | GET is naturally idempotent                     |
| Response header    | Echo `Idempotency-Key` on response               | Client confirmation the key was processed       |

### Why This Is Junior-Friendly

- Zero config to start — add middleware, send header, it works
- No per-endpoint setup needed
- Clear cause-and-effect: send same key → get same response
- No silent failures — storage down doesn't break requests
- Follows Stripe's well-documented pattern (easy to look up)

### Open Questions

- Should we cache only 2xx responses or all responses (including errors)?
- How to handle response stream cloning for body capture in edge runtimes?
- Should there be a max body size for caching?
