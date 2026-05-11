# Feature Landscape: Hono Middleware Ecosystem

**Domain:** Web framework middleware (Hono-focused, with Express/Fastify/Koa comparison)
**Researched:** 2026-05-11

## Table Stakes Middleware

Features every production Hono app needs. Missing = product feels incomplete.

### Security & Auth

| Feature | Hono Status | Complexity | Notes |
|---------|-------------|------------|-------|
| **CORS** | Built-in (`hono/cors`) | Low | Full origin/method/header customization. Works across all runtimes. |
| **JWT Auth** | Built-in (`hono/jwt`) | Low | Supports HS256/RS256. No refresh token support — must build custom. |
| **Bearer Token Auth** | Built-in (`hono/bearer-auth`) | Low | Simple token comparison. No OAuth flow. |
| **Basic Auth** | Built-in (`hono/basic-auth`) | Low | RFC 7617 compliant. Only for simple/internal use. |
| **CSRF Protection** | Built-in (`hono/csrf`) | Low | Origin/referrer-based. No double-submit cookie pattern. |
| **Secure Headers** | Built-in (`hono/secure-headers`) | Low | CSP, HSTS, X-Frame-Options, etc. Comprehensive but requires careful CSP config. |
| **IP Restriction** | Built-in (`hono/ip-restriction`) | Low | Allow/deny lists. Relies on `getConnInfo` which varies by runtime. |
| **OAuth Providers** | Third-party (`@hono/oauth-providers`) | Medium | Google, GitHub, Facebook, etc. Community-maintained, not core. |
| **Session Management** | Third-party (`@hono/session`) | Medium | Cookie-based sessions. Limited to cookie storage — no Redis/DB adapters. |
| **Rate Limiting** | **MISSING from core** | Medium-High | Community: `hono-rate-limiter` (npm), `@hono-rate-limiter/hono-rate-limiter` (JSR). No official `@hono/rate-limiter` — open issue #1411 in honojs/middleware. Multiple fragmented implementations. |

### Request/Response Processing

| Feature | Hono Status | Complexity | Notes |
|---------|-------------|------------|-------|
| **Body Parsing** | Built-in (native `c.req.json()`, `c.req.parseBody()`) | Low | Web standards-based. `parseBody()` handles multipart/form-data natively. |
| **Body Size Limit** | Built-in (`hono/body-limit`) | Low | Content-Length check + stream reading. Bun requires separate `maxRequestBodySize` config. |
| **Request Timeout** | Built-in (`hono/timeout`) | Low | Cannot be used with streaming. Was missing from JSR initially (issue #3635). |
| **Compression** | Built-in (`hono/compress`) — gzip only | Low | Only supports gzip. No Brotli. `@hono/bun-compress` adds Brotli for Bun only. Node.js lacks built-in compression middleware. |
| **ETag** | Built-in (`hono/etag`) | Low | Weak/strong ETag support. Works with cache middleware. |
| **Trailing Slash** | Built-in (`hono/trailing-slash`) | Low | Append or redirect. Simple but effective. |
| **Method Override** | Built-in (`hono/method-override`) | Low | `_method` query param or header. Standard pattern. |
| **Pretty JSON** | Built-in (`hono/pretty-json`) | Low | Dev-only typically. |

### Observability

| Feature | Hono Status | Complexity | Notes |
|---------|-------------|------------|-------|
| **Logger** | Built-in (`hono/logger`) | Low | Simple console logger. No structured output, no log levels, no request ID correlation. Open issue #3963 requests better logger. |
| **Request ID** | Built-in (`hono/request-id`) | Low | Generates/propagates X-Request-ID. No correlation with logs built-in. |
| **Server-Timing** | Built-in (`hono/timing`) | Low | Server-Timing header support. Useful for dev profiling. |
| **OpenTelemetry** | Third-party (`@hono/otel`) | Medium | Official integration. Good for tracing. |
| **Prometheus Metrics** | Third-party (`@hono/prometheus`) | Medium | Official integration. Standard metrics. |
| **Sentry** | Third-party (`@hono/sentry`) | Low | Official integration. Error tracking. |
| **Pino Logger** | Community (`hono-pino`) | Medium | Not official. Structured logging with Pino. |
| **LogTape** | Community (`logtape`) | Medium | Not official. Structured logging alternative. |

### Development & DX

| Feature | Hono Status | Complexity | Notes |
|---------|-------------|------------|-------|
| **Validator (built-in)** | Built-in (`hono/validator`) | Low | Custom validator function. Not schema-based — requires adapter for Zod/Valibot/etc. |
| **Zod Validator** | Third-party (`@hono/zod-validator`) | Low | The de facto standard. Type-safe, infers route types. |
| **Valibot Validator** | Third-party (`@hono/valibot-validator`) | Low | Official adapter. |
| **TypeBox Validator** | Third-party (`@hono/typebox-validator`) | Low | Official adapter. |
| **ArkType Validator** | Third-party (`@hono/arktype-validator`) | Low | Official adapter. |
| **Effect Validator** | Third-party (`@hono/effect-validator`) | Low | Official adapter. |
| **Standard Schema Validator** | Third-party (`@hono/standard-validator`) | Low | Universal adapter for any Standard Schema-compliant library. |
| **OpenAPI (Zod)** | Third-party (`@hono/zod-openapi`) | High | Most popular OpenAPI integration. Generates spec from Zod schemas. |
| **Swagger UI** | Third-party (`@hono/swagger-ui`) | Low | Serves Swagger UI page. |
| **Scalar** | Third-party (Scalar integration) | Low | Alternative to Swagger UI. |
| **Combine Middleware** | Built-in (`hono/combine`) | Low | `some()`, `every()`, `except()` for conditional middleware composition. |
| **Powered-By Header** | Built-in (`hono/powered-by`) | Low | Adds `X-Powered-By: Hono`. |

### Caching

| Feature | Hono Status | Complexity | Notes |
|---------|-------------|------------|-------|
| **Cache Middleware** | Built-in (`hono/cache`) | Medium | Uses Web Cache API. Works on Cloudflare Workers/Deno. **Does NOT support Redis, memory, or filesystem adapters** — open issue #3857. Major gap for Node.js deployments. |

## Differentiating Middleware

Features that would make a utility library stand out. These are either missing, fragmented, or poorly served in the current ecosystem.

### High-Value Gaps

| Feature | Why It Differentiates | Complexity | Current State |
|---------|----------------------|------------|---------------|
| **Universal Cache Adapter** | Hono's cache middleware only works with Web Cache API (edge runtimes). Node.js users need Redis/memory/FS adapters. Issue #3857 explicitly requests this. | Medium | Missing. Community workarounds exist but no standard. |
| **Official Rate Limiter** | Multiple fragmented implementations (`hono-rate-limiter`, `workers-hono-rate-limit`, `@hono-rate-limiter/hono-rate-limiter`). Issue #1411 requests official `@hono/rate-limiter`. | Medium-High | Fragmented. No official package. |
| **Structured Logger** | Built-in logger is console-only, no levels, no JSON output. Issue #3963 requests flexible logger supporting any library. `@hono/structured-logger` exists but is minimal. | Medium | Partial. `@hono/structured-logger` exists but limited. |
| **Idempotency Keys** | Stripe-style idempotency for POST/PUT. Community: `hono-idempotency`, `idempot-js`. Not in core or @hono namespace. | Medium | Community-only. |
| **Problem Details (RFC 9457)** | Standardized error response format. Community: `hono-problem-details`. Not in @hono namespace. | Low | Community-only. |
| **File Upload Validation** | `parseBody()` works but Zod validation of multipart forms is awkward. Issue #906 in middleware repo. | Medium | Pain point. No clean solution. |
| **Request Body Validation for Forms** | Zod validator supports `json`, `query`, `param`, `header`, `cookie` — but `form` validation has edge cases with File objects. | Medium | Partial gap. |
| **DI Container** | `hono-simple-DI` and `@hono/tsyringe` exist but are community. No standard DI pattern. | Medium | Fragmented. |
| **Event Emitter** | `@hono/event-emitter` exists but is minimal. No standard event-driven pattern for Hono apps. | Low-Medium | Partial. |
| **Health Check Endpoint** | No built-in health check middleware. Every app writes their own `/health` route. | Low | Missing. Trivial but universally needed. |
| **Request Validation Pipeline** | Chain multiple validators (body + query + headers) with unified error response. Currently requires multiple `zValidator()` calls. | Medium | DX gap. |
| **Response Transformation** | Standard middleware for wrapping all responses in `{ data, error, meta }` envelope. | Low | Every team builds their own. |
| **API Versioning** | No built-in versioning strategy (URL path, header, query param). | Low-Medium | Missing. |
| **Webhook Signature Verification** | Common need (Stripe, GitHub, etc.). No standard middleware. | Low | Missing. |
| **Multi-Tenant Context** | Extract tenant from subdomain/header, set in context. Common for SaaS. | Low | Missing. |

### Medium-Value Gaps

| Feature | Why It Differentiates | Complexity | Current State |
|---------|----------------------|------------|---------------|
| **Brotli Compression (Node.js)** | `hono/compress` only does gzip. `@hono/bun-compress` is Bun-only. Node.js has no built-in compression middleware. | Low | Missing for Node.js. |
| **Graceful Shutdown** | No built-in lifecycle hooks for drain/flush on SIGTERM. | Medium | Missing. |
| **Request Deduplication** | Prevent concurrent identical requests (cache stampede protection). | Medium | Missing. |
| **Circuit Breaker** | Protect against cascading failures when calling external services. | Medium | Missing. |
| **Retry Logic** | Automatic retry with backoff for failed requests. | Medium | Missing. |
| **Request Logging Middleware (Pino/Winston)** | Structured request/response logging with correlation IDs, duration, status. | Low | Community-only (`hono-pino`). |
| **Audit Logging** | Track who did what for compliance. | Medium | Missing. |
| **Request Size Analytics** | Track request/response sizes for capacity planning. | Low | Missing. |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Full ORM/Database Layer** | Hono's philosophy is runtime-agnostic. Database libraries vary wildly by runtime (D1 for Workers, PostgreSQL for Node.js). | Provide adapters/hooks for popular ORMs (Drizzle, Kysely, Prisma) but don't build an ORM. |
| **Template Engine** | Hono has `hono/jsx` built-in. Adding EJS/Pug/etc. contradicts the framework's direction. | Use `hono/jsx` for server-side rendering. It's already there. |
| **WebSocket Core** | Hono provides `upgradeWebSocket` helper and `@hono/node-ws` adapter. WebSocket protocols are runtime-specific. | Don't build a new WS abstraction. Improve existing adapters if needed. |
| **HTML Form Renderer** | Hono is API-first. Form rendering is better handled by frontend frameworks or HonoX. | Focus on API middleware, not view rendering. |
| **Authentication Provider** | Auth is complex and security-critical. `@hono/auth-js`, `@hono/clerk-auth`, `@hono/firebase-auth` already cover major providers. | Build adapters/integrations, not a new auth system. |
| **GraphQL Server** | `@hono/graphql-server` already exists. GraphQL has its own ecosystem (Apollo, Yoga, etc.). | Don't compete. Integrate if needed. |
| **tRPC Server** | `@hono/trpc-server` already exists and is well-maintained. | Don't build. Use the existing adapter. |
| **MCP Server** | `@hono/mcp` already exists in the middleware repo. | Don't build. Use the existing adapter. |
| **Heavy Validation Library** | Hono's validator ecosystem (Zod, Valibot, TypeBox, ArkType, Effect, Standard Schema) is already comprehensive. | Build adapters, not a new validator. |
| **Express Middleware Wrapper** | `@hono/express` is a requested feature (issue #934) for gradual migration, but wrapping Express middleware defeats Hono's web-standards approach. | If building, make it a migration aid, not a permanent pattern. |
| **Server-Sent Events Core** | Hono has `streamSSE` built-in. SSE is a streaming pattern, not a middleware concern. | Don't abstract. Use the built-in streaming helpers. |
| **Full i18n System** | `@hono/language` middleware exists for language detection. Full i18n (translations, pluralization) is app-level concern. | Provide language detection, not translation management. |

## Complexity Assessment

| Middleware | Complexity | Why |
|------------|------------|-----|
| CORS | Low | Header manipulation. Well-understood spec. |
| JWT Auth | Low | Token verification. Standard crypto libraries. |
| Bearer Auth | Low | String comparison. |
| Basic Auth | Low | Base64 decode + string comparison. |
| CSRF | Low | Origin/referrer checking. |
| Secure Headers | Low | Header setting. Complexity in CSP policy design (user responsibility). |
| IP Restriction | Low-Medium | IP parsing + list matching. Runtime-specific IP extraction adds complexity. |
| Rate Limiting | Medium-High | Requires storage backend (memory, Redis, KV). Sliding window algorithms. Multi-instance synchronization. |
| Body Limit | Low | Stream size tracking. |
| Timeout | Low | Promise.race with timer. Cannot work with streaming. |
| Compression | Low-Medium | Gzip is simple. Brotli adds dependency. Streaming compression adds complexity. |
| ETag | Low | Hash computation. |
| Logger | Low-Medium | Simple console is easy. Structured JSON logging with levels, correlation, and request context is medium. |
| Request ID | Low | UUID generation + header propagation. |
| Cache (Web API) | Medium | Cache key generation, Vary header handling, stale-while-revalidate. |
| Cache (Redis/Memory) | Medium-High | Serialization, TTL management, cache invalidation, multi-instance consistency. |
| Zod Validator | Low | Schema validation + type inference. Well-solved. |
| OpenAPI Generation | High | Schema translation, spec generation, UI serving, type synchronization. |
| Session | Medium | Cookie encryption, storage backend, rotation, expiration. |
| Idempotency | Medium | Key storage, response caching, TTL, conflict detection. |
| Problem Details | Low | Error formatting. RFC 9457 is straightforward. |
| Health Check | Low | Status check, dependency ping, response formatting. |
| Webhook Verification | Low-Medium | HMAC signature verification. Algorithm varies by provider. |
| DI Container | Medium | Dependency resolution, lifecycle management, scoping. |
| Circuit Breaker | Medium-High | State machine (closed/open/half-open), failure counting, recovery timing. |
| Request Deduplication | Medium | In-flight request tracking, key normalization, result sharing. |
| API Versioning | Low-Medium | Route matching, version extraction, deprecation headers. |
| Response Transformation | Low | Response wrapping. Complexity in preserving status codes and headers. |
| Multi-Tenant Context | Low | Header/subdomain parsing, context setting. |
| Audit Logging | Medium | Event capture, PII handling, storage, retention policies. |
| Graceful Shutdown | Medium | Connection draining, in-flight request tracking, timeout enforcement. |

## Dependencies Between Features

```
Rate Limiting → Storage Backend (Redis/Memory/KV)
     ↓
Cache (Redis) → Storage Backend (Redis/Memory/KV)
     ↓
Idempotency → Storage Backend (Redis/Memory/KV)
     ↓
Session → Storage Backend (Cookie/Redis/DB)
     ↓
Request Deduplication → In-Memory Store or Redis

Health Check → Dependency Pinging (DB, Redis, External APIs)
     ↓
Audit Logging → Request ID (for correlation)
     ↓
Structured Logger → Request ID (for correlation)
     ↓
Problem Details → Error Handler (app.onError)

API Versioning → Route Structure (affects all routes)
     ↓
Response Transformation → Error Handler + All Route Responses
     ↓
Multi-Tenant Context → Auth Middleware (tenant extraction before auth)

Circuit Breaker → External Service Calls (not general middleware)
     ↓
Webhook Verification → Body Parsing (needs raw body for HMAC)
     ↓
OpenAPI Generation → Zod Validator (schema source)
```

**Storage Backend is the critical dependency:** Rate limiting, caching, idempotency, sessions, and request deduplication all need a storage layer. A unified storage adapter interface would serve all of these.

## Community Pain Points and Gaps

### 1. No Official Rate Limiter (Issue #1411)
**Pain:** Three competing implementations with different APIs. `hono-rate-limiter` (npm), `@hono-rate-limiter/hono-rate-limiter` (JSR), and `workers-hono-rate-limit` (Cloudflare-specific). Developers don't know which to pick.
**Impact:** HIGH — rate limiting is table-stakes for any public API.
**Source:** [honojs/middleware#1411](https://github.com/honojs/middleware/issues/1411)

### 2. Cache Middleware Limited to Web Cache API (Issue #3857)
**Pain:** Built-in `hono/cache` only works with the Web Cache API (Cloudflare Workers, Deno). Node.js users have no caching middleware. No Redis, memory, or filesystem adapter support.
**Impact:** HIGH — caching is essential for Node.js deployments.
**Source:** [honojs/hono#3857](https://github.com/honojs/hono/issues/3857)

### 3. Built-in Logger is Too Basic (Issue #3963)
**Pain:** `hono/logger` only does console.log with method + URL. No log levels, no structured JSON output, no request duration, no correlation with request IDs. Community requests flexible logger that supports any logging library.
**Impact:** MEDIUM — teams immediately replace it with Pino/Winston.
**Source:** [honojs/hono#3963](https://github.com/honojs/hono/issues/3963)

### 4. Multipart Form Validation is Awkward (Issue #906)
**Pain:** When using `zValidator('form', schema)`, File objects in the form data don't validate cleanly against Zod schemas. Mixed JSON + File fields in multipart forms require workarounds.
**Impact:** MEDIUM — file upload is a common requirement.
**Source:** [honojs/middleware#906](https://github.com/honojs/middleware/issues/906)

### 5. Error Handling Type Inference is Broken
**Pain:** When middleware throws (e.g., validation error), the RPC client type doesn't reflect the error response shape. `app.onError()` responses aren't inferred in the RPC client type.
**Impact:** MEDIUM — breaks end-to-end type safety promise.
**Source:** [hono.dev/docs/guides/rpc](https://hono.dev/docs/guides/rpc)

### 6. Smaller Ecosystem vs Express/Fastify
**Pain:** Express has middleware for everything (Multer for uploads, Helmet for security, Express-Validator, etc.). Fastify has `@fastify/*` plugins for databases, auth, caching. Hono's ecosystem is growing but gaps remain.
**Impact:** MEDIUM — developers migrating from Express/Fastify expect equivalent middleware.
**Source:** Reddit r/node discussions, Better Stack comparison articles

### 7. No Standard DI Pattern
**Pain:** `hono-simple-DI` and `@hono/tsyringe` exist but neither is widely adopted. No consensus on dependency injection for Hono apps.
**Impact:** LOW-MEDIUM — affects larger applications more than small APIs.

### 8. Node.js Feels Second-Class
**Pain:** Hono was designed for edge runtimes first. Node.js support via `@hono/node-server` works but some features (compression, WebSocket, file streaming) require Node-specific adapters that lag behind edge features.
**Impact:** MEDIUM — Node.js is still the most common deployment target.
**Source:** Reddit r/node: "Hono was made for Cloudflare workers and its Node.js support feels like second class citizen"

### 9. No Health Check Middleware
**Pain:** Every Hono app manually implements `/health` and `/ready` endpoints. No standard middleware for health checks with dependency status reporting.
**Impact:** LOW — trivial to implement but universally needed.

### 10. Timeout Middleware Incompatible with Streaming
**Pain:** `hono/timeout` cannot be used with SSE or streaming responses. Developers must manually manage `setTimeout` + `stream.close()`.
**Impact:** LOW — edge case but frustrating when needed.
**Source:** [hono.dev/docs/middleware/builtin/timeout](https://hono.dev/docs/middleware/builtin/timeout)

## MVP Recommendation

**Prioritize (highest impact, lowest complexity):**
1. **Universal Cache Adapter** — solves the #1 Node.js gap. Medium complexity, massive impact.
2. **Official Rate Limiter** — solves fragmentation. Medium-high complexity, table-stakes feature.
3. **Structured Logger** — replaces basic logger. Medium complexity, immediate value.
4. **Health Check Middleware** — trivial but universally needed. Low complexity.
5. **Problem Details (RFC 9457)** — standardized errors. Low complexity, high DX value.

**Defer:**
- **Circuit Breaker** — complex, niche use case
- **DI Container** — opinionated, existing solutions work
- **Full i18n** — app-level concern, not middleware
- **Webhook Verification** — provider-specific, better as adapters

## Sources

- [Hono Built-in Middleware](https://hono.dev/docs/guides/middleware)
- [Hono Third-party Middleware](https://hono.dev/docs/middleware/third-party)
- [honojs/hono GitHub — src/middleware](https://github.com/honojs/hono/tree/main/src/middleware)
- [honojs/middleware GitHub — packages](https://github.com/honojs/middleware/tree/main/packages)
- [DeepWiki: honojs/middleware](https://deepwiki.com/honojs/middleware)
- [Issue #1411: Official rate limiting middleware](https://github.com/honojs/middleware/issues/1411)
- [Issue #3857: Universal Cache Middleware](https://github.com/honojs/hono/issues/3857)
- [Issue #3963: Better logger middleware](https://github.com/honojs/hono/issues/3963)
- [Issue #906: Multi-field form data validation](https://github.com/honojs/middleware/issues/906)
- [Issue #3635: Timeout middleware missing from JSR](https://github.com/honojs/hono/issues/3635)
- [Issue #1734: Omit default error handling](https://github.com/honojs/hono/issues/1734)
- [Better Stack: Hono vs Fastify](https://betterstack.com/community/guides/scaling-nodejs/hono-vs-fastify/)
- [Hono Rate Limiter (community)](https://github.com/rhinobase/hono-rate-limiter)
- [hono-problem-details (community)](https://github.com/paveg/hono-problem-details)
- [hono-idempotency (community)](https://github.com/paveg/hono-idempotency)
- [Hono Best Practices](https://hono.dev/docs/guides/best-practices)
