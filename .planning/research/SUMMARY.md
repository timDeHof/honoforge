# Project Research Summary

**Project:** honoforge
**Domain:** Hono ecosystem utility libraries & middleware
**Researched:** 2026-05-11
**Confidence:** HIGH

## Executive Summary

honoforge is a scoped collection of utility packages (`@honoforge/*`) for the Hono web framework ecosystem. Hono (v4.12.18) is a Web Standards-based framework running on any JavaScript runtime, with a ~34KB core and zero dependencies. The ecosystem follows a two-tier architecture: built-in middleware ships as subpath exports within `hono` itself, while community/official packages publish under `@hono/*` from a shared monorepo.

The recommended approach is to follow the `@hono/*` conventions exactly: pnpm workspaces, tsdown for dual ESM/CJS bundling, Vitest for testing, Changesets for versioning, and `hono >=4.10.0` as a peer dependency (never a runtime dependency). The biggest opportunity is filling gaps the official ecosystem hasn't addressed — most notably a universal cache adapter (Node.js has no caching middleware), an official rate limiter (three fragmented community implementations), and a structured logger (built-in logger is console-only).

The key risk is Hono's type system complexity. With 50+ routes, TypeScript's instantiation limits cause IDE freezes (TS2589), and middleware chain type inference breaks if middleware isn't wrapped in `createMiddleware`. These are well-documented pitfalls with known mitigations — pre-compile client types, always use `createFactory`, and enforce `type` (not `interface`) for Env generics from day one.

## Key Findings

### Recommended Stack

Hono packages follow a strict convention: zero runtime dependencies, peer deps only, tsdown bundling, dual ESM/CJS exports, and npm provenance. honoforge already uses tsdown, Vitest, TypeScript, and ESLint — perfectly aligned with ecosystem standards.

**Core technologies:**
- **Hono `>=4.10.0`** (peer dep) — matches `@hono/zod-validator` and `@hono/zod-openapi`; ensures current validator API and type inference
- **tsdown** — ecosystem standard bundler; dual ESM/CJS + DTS generation, built-in attw + publint
- **Vitest** — used by Hono core and all middleware packages; supports `@cloudflare/vitest-pool-workers` for edge testing
- **`@hono/standard-validator`** — universal validator adapter supporting any `@standard-schema/spec` library (Zod, Valibot, ArkType)
- **Changesets** — versioning and publishing standard for the middleware monorepo

### Expected Features

**Must have (table stakes):**
- CORS, JWT/Bearer/Basic auth, CSRF, secure headers — all built-in to Hono, no work needed
- Zod/Standard Schema validation — `@hono/zod-validator` is the de facto standard
- Request ID, basic logger, ETag, compression — built-in, but logger needs structured replacement
- OpenAPI generation — `@hono/zod-openapi` is the most popular integration

**Should have (differentiators — honoforge's opportunity):**
- **Universal cache adapter** — #1 Node.js gap (issue #3857); Hono's cache only works on edge runtimes
- **Rate limiter** — #2 fragmentation issue (issue #1411); three competing community implementations
- **Structured logger** — built-in logger is console-only; teams immediately replace with Pino/Winston
- **Health check middleware** — trivial but universally needed; every app writes their own
- **Problem Details (RFC 9457)** — standardized error responses; community-only currently
- **Idempotency keys** — Stripe-style request deduplication; community-only

**Defer (v2+):**
- Circuit breaker — complex, niche
- DI container — opinionated, existing solutions work
- Full i18n — app-level concern
- Webhook verification — provider-specific, better as adapters

### Architecture Approach

Hono uses a two-tier split: core (`honojs/hono`, zero external deps) and third-party (`honojs/middleware`, `@hono/*` namespace). Each `@hono/*` package has a single entry point, dual ESM/CJS exports via tsdown, and declares `hono` as a peer dependency. The type system revolves around the `Env` interface with `Variables` and `Bindings` that accumulate through middleware chaining via `IntersectNonAnyTypes`.

**Major components:**
1. **`@honoforge/core`** — Zero peer deps beyond `hono`. Shared types, HTTP status codes, utility functions. No external dependencies.
2. **`@honoforge/middleware`** — Peer deps: `hono>=4.10.0`. Cache adapter, rate limiter, structured logger, health check, problem details. Each middleware uses `createMiddleware` with typed generics.
3. **`@honoforge/openapi`** — Peer deps: `hono>=4.10.0`, `zod`. Build on `@hono/zod-openapi` patterns. Extend `OpenAPIHono`, don't rebuild from scratch.
4. **`@honoforge/testing`** — Wrap `testClient` from `hono/testing`. Mock context utilities.

### Critical Pitfalls

1. **Type instantiation depth (TS2589)** — 50+ routes cause IDE freezes. **Prevent:** Pre-compile client types at build time, split into per-domain clients, use explicit type arguments for hot paths.
2. **Bundling Hono instead of peer dep** — Causes duplicate installs, breaks singleton patterns. **Prevent:** Always `peerDependencies`, run `publint` + `attw` in CI.
3. **Cache middleware silently fails on Node.js** — Web Cache API not available. **Prevent:** Build universal adapter detecting runtime (Web Cache API on edge, Redis/memory on Node.js).
4. **Middleware loses type inference mid-chain** — Raw async functions get `BlankEnv`. **Prevent:** Always wrap in `createMiddleware` or use `createFactory<AppEnv>()`.
5. **OpenAPIHono + plain Hono mixing** — OpenAPI spec loses mounted routes. **Prevent:** Use `OpenAPIHono` at top level, never mount it inside plain `Hono`.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation & Package Scaffolding
**Rationale:** Dependency conventions, build tooling, and CI configuration are the easiest to get wrong and hardest to fix later. 8 pitfalls map to this phase.
**Delivers:** Monorepo structure with `@honoforge/core`, tsdown configs, Vitest setup, ESLint rules, Changesets, npm provenance CI.
**Addresses:** Core types, shared utilities, HTTP status codes.
**Avoids:** Pitfalls 2, 6, 11, 12, 13, 23, 25, 26 (version pinning, peer dep conventions, package.json exports, attw/publint, provenance).

### Phase 2: Middleware Base — Cache, Rate Limiter, Logger
**Rationale:** These three middleware fill the highest-impact ecosystem gaps and share a common dependency: a storage backend interface. Building them together establishes the middleware pattern.
**Delivers:** Universal cache adapter (Web Cache API + Redis + memory), rate limiter (sliding window with pluggable storage), structured logger (Pino/Winston integration), health check middleware.
**Uses:** `createMiddleware` pattern, `createFactory<AppEnv>()`, peer dep `hono>=4.10.0`.
**Implements:** Storage adapter interface serving cache, rate limiting, and future idempotency.
**Avoids:** Pitfalls 3, 16, 17, 18 (middleware type inference, unnecessary compression on Workers, cache on Node.js, timeout/streaming incompatibility).

### Phase 3: Validation & Error Handling
**Rationale:** Validation and error formatting are prerequisites for OpenAPI integration. Problem Details (RFC 9457) standardizes error responses that OpenAPI specs will reference.
**Delivers:** Standard Schema validator wrapper, Problem Details middleware (RFC 9457), response transformation middleware (`{ data, error, meta }` envelope), API versioning middleware.
**Addresses:** Zod version compatibility testing, unified error response format.
**Avoids:** Pitfall 5 (Zod version conflicts) — test against both Zod v3 and v4.

### Phase 4: OpenAPI Integration
**Rationale:** The most complex phase with the most pitfalls (10 mapped here). Depends on validation layer being stable. Route count explodes here, making type performance critical.
**Delivers:** `ForgeAPI` class extending `OpenAPIHono`, `createForgeRoute` factory, auto-validator generation, OpenAPI document endpoints, Swagger UI integration.
**Uses:** `@hono/zod-openapi` patterns, `@asteasolutions/zod-to-openapi` as dependency.
**Avoids:** Pitfalls 1, 4, 7, 9, 10, 15, 19, 20, 21, 22 (type depth, `c.notFound()` RPC break, OpenAPIHono mixing, header lowercase, defaultHook inheritance, Content-Type silent failure, `$()` converter, path syntax, schema conflicts).

### Phase 5: Testing & Cross-Runtime Validation
**Rationale:** Testing utilities depend on all previous phases. Cross-runtime testing (Node.js, Bun, Cloudflare Workers, Deno) validates everything built so far.
**Delivers:** `testForgeClient` wrapping `hono/testing`, mock context utilities, CI matrix for all target runtimes, documentation with runtime-specific examples.
**Avoids:** Pitfalls 14, 24 (Deno/JSR version mismatch, missing runtime examples).

### Phase Ordering Rationale

- **Phase 1 first** because dependency conventions and build tooling are foundational — getting peer deps wrong means republishing everything.
- **Phase 2 before Phase 3** because cache and rate limiter share a storage backend interface; building them together avoids duplicating the adapter layer.
- **Phase 3 before Phase 4** because OpenAPI integration depends on stable validation and error response formats. Problem Details defines the error shape that OpenAPI specs reference.
- **Phase 4 is the complexity peak** — 10 of 26 pitfalls cluster here. It needs the most careful execution but builds on well-established `@hono/zod-openapi` patterns.
- **Phase 5 last** because testing utilities need all middleware to exist first, and cross-runtime validation is a verification step, not a feature.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Cache/Rate Limiter):** Storage backend interface design needs careful thought — Redis vs memory vs KV adapters, sliding window algorithm selection, multi-instance synchronization for rate limiting.
- **Phase 4 (OpenAPI):** Type performance optimization strategy needs validation at scale. Pre-compiling client types and per-domain client splitting should be prototyped before committing.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Well-documented. The `@hono/*` monorepo provides exact templates for tsdown configs, package.json structure, and CI setup.
- **Phase 3 (Validation):** `@hono/standard-validator` and `@hono/zod-validator` provide clear patterns. Problem Details is a straightforward RFC 9457 implementation.
- **Phase 5 (Testing):** `hono/testing`'s `testClient` is the standard. Cross-runtime testing follows established `@cloudflare/vitest-pool-workers` patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified against 20+ `@hono/*` package.json files, middleware monorepo configs, and Hono source code |
| Features | HIGH | Mapped against Hono built-in middleware, `@hono/*` packages, and 10+ GitHub issues documenting gaps |
| Architecture | HIGH | Analyzed `honojs/hono` and `honojs/middleware` directory structures, export patterns, and type system |
| Pitfalls | HIGH | 26 pitfalls sourced from GitHub issues, Hono docs, known issues page, and package behavior analysis |

**Overall confidence:** HIGH

### Gaps to Address

- **Storage backend interface design:** The research identifies that cache, rate limiting, idempotency, and sessions all need a storage layer, but the optimal interface (unified vs per-middleware) needs validation during Phase 2 planning.
- **`@hono/standard-validator` adoption:** New package (v0.2.2) with limited ecosystem adoption. Risk: may have undiscovered bugs. Mitigation: also support `@hono/zod-validator` as fallback.
- **Zod v3 vs v4 dual support:** `@hono/zod-validator` supports both ranges. Testing against both is recommended but adds CI complexity. Decide during Phase 3 planning whether to support both or pin to one.
- **Node.js as deployment target:** Reddit feedback suggests Node.js feels "second-class" in Hono. honoforge should explicitly target Node.js parity — this affects cache adapter design, compression middleware, and documentation examples.

## Sources

### Primary (HIGH confidence)
- **Hono npm package** (v4.12.18) — https://www.npmjs.com/package/hono
- **Hono GitHub** — https://github.com/honojs/hono (source code, releases, MIGRATION.md)
- **Hono Middleware Monorepo** — https://github.com/honojs/middleware (20+ `@hono/*` package.json files analyzed)
- **Hono Docs** — https://hono.dev/docs/guides/middleware, /best-practices, /validation, /helpers/factory
- **All `@hono/*` package.json files** — Fetched directly from GitHub raw content

### Secondary (MEDIUM confidence)
- **GitHub Issue #1411** — Official rate limiter request (fragmented community implementations)
- **GitHub Issue #3857** — Universal cache middleware request (Node.js gap)
- **GitHub Issue #3963** — Better logger request (built-in is too basic)
- **GitHub Issue #906** — Multipart form validation pain point
- **GitHub Issue #2399** — Type instantiation performance (open, known issue)
- **GitHub Issue #1306** — defaultHook not inherited in nested routes (open)
- **Reddit r/node** — Community sentiment on Node.js support

### Tertiary (LOW confidence)
- **Better Stack comparison** — Hono vs Fastify article (external analysis)
- **Community package npm pages** — `hono-rate-limiter`, `hono-problem-details`, `hono-idempotency` (not officially maintained)

---
*Research completed: 2026-05-11*
*Ready for roadmap: yes*
