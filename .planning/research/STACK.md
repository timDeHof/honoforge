# Technology Stack: Hono Ecosystem

**Project:** honoforge
**Researched:** 2026-05-11

## Overview

Hono is a Web Standards-based web framework (current: **v4.12.18**) that runs on any JavaScript runtime. Its architecture is built on three principles: ultrafast RegExp routing, Web Standards compatibility, and minimal core with middleware extensibility. The framework ships ~34KB with zero dependencies.

Hono's middleware ecosystem is split into two tiers:
1. **Built-in middleware** — shipped as subpath exports within the `hono` package itself (e.g., `hono/cors`, `hono/jwt`, `hono/logger`)
2. **Community/official middleware** — published under `@hono/*` namespace from the [honojs/middleware](https://github.com/honojs/middleware) monorepo

For honoforge (scoped utility packages for the Hono ecosystem), the key insight is: **Hono packages use zero runtime dependencies, peer deps only, tsdown for bundling, and dual ESM/CJS exports.**

---

## Hono Version & Compatibility

### Current Version
| Package | Version | Released |
|---------|---------|----------|
| `hono` | **4.12.18** | 2026-05-06 |
| `@hono/zod-validator` | 0.8.0 | — |
| `@hono/zod-openapi` | 1.4.0 | — |
| `@hono/standard-validator` | 0.2.2 | — |
| `@hono/otel` | 1.1.2 | — |
| `@hono/swagger-ui` | 0.6.1 | — |
| `@hono/node-server` | 2.0.2 | — |

### Peer Dependency Range for `hono`
The `@hono/*` middleware packages use varied peer dependency ranges:

| Pattern | Packages Using It | Recommendation |
|---------|-------------------|----------------|
| `hono: "*"` | basic-auth, arktype-validator, event-emitter, firebase-auth, bun-transpiler | Too loose — avoid |
| `hono: ">=3.0.0"` | sentry, prometheus, graphql-server | Broad but safe for v3+ |
| `hono: ">=3.9.0"` | valibot-validator, typebox-validator, standard-validator | Targets validator API stability |
| `hono: ">=4.0.0"` | swagger-ui, otel, hello, react-renderer | **Recommended baseline** |
| `hono: ">=4.10.0"` | zod-validator, zod-openapi | Targets latest validator/types |
| `hono: "^4"` | node-server | Narrower, pins major |

**Recommendation for honoforge:** Use `"hono": ">=4.10.0"` as the peer dependency. This is what `@hono/zod-validator` and `@hono/zod-openapi` use, and it ensures access to the current validator API, type inference improvements, and the `createFactory`/`createMiddleware` patterns from `hono/factory`.

### Recent Changes Affecting Middleware Authors

**v4.12.x (current series):**
- **Security fix (v4.12.18):** Cache middleware now properly handles `Vary: Authorization` / `Vary: Cookie` — middleware authors using caching must be aware of this
- **Security fix (v4.12.16):** `bodyLimit()` now enforces limits for chunked/unknown-length requests
- **Type fix (v4.12.17):** Middleware response types now propagate to `app.on` overloads — important for middleware that returns early
- **Type fix (v4.12.13):** Response type inference from last handler in `app.on` 9-/10-handler overloads

**v4.0.0 (major breaking — already applied):**
- `c.jsonT()`, `c.stream()`, `c.streamText()`, `c.env()` removed — use `hono/streaming` and `hono/adapter`
- `app.showRoutes()`, `app.routerName`, `app.head()`, `app.handleEvent()` removed
- `req.cookie()`, `req.headers()`, `req.body()` etc. removed — use `hono/cookie` and `req.raw` methods
- `hono/nextjs` adapter removed — use `hono/vercel`
- `serveStatic` for Cloudflare Workers requires `manifest` option
- Must use `type` (not `interface`) for Hono generics

**v4.3.11 → v4.4.0:**
- `deno.land/x` publishing stopped — use JSR (`jsr:@hono/hono`)

**Validator deprecation (ongoing):**
- The built-in `hono/validator` is deprecated in favor of third-party validators (Zod, Valibot, TypeBox, etc.)
- `@hono/standard-validator` is the new standard, supporting any validator implementing `@standard-schema/spec`

---

## Middleware Architecture

### Core Type Signature

```typescript
export type MiddlewareHandler<
  E extends Env = any,
  P extends string = string,
  I extends Input = {},
  R extends HandlerResponse<any> = Response,
> = (c: Context<E, P, I>, next: Next) => Promise<R | void>

export type Env = {
  Bindings?: Bindings    // Runtime bindings (KV, DB, etc.)
  Variables?: Variables  // Context variables set via c.set()
}

export type Next = () => Promise<void>
```

### Standard Middleware Pattern

```typescript
import { createMiddleware } from 'hono/factory'

// Simple middleware
const timingMiddleware = createMiddleware(async (c, next) => {
  const start = Date.now()
  await next()
  c.header('X-Elapsed', `${Date.now() - start}ms`)
})

// Typed middleware (injects variables into context)
const authMiddleware = createMiddleware<{
  Variables: { user: { id: string; role: string } }
}>(async (c, next) => {
  const user = await authenticate(c.req.header('Authorization'))
  c.set('user', user)
  await next()
})

// Parameterized middleware (factory pattern)
const rateLimiter = (options: RateLimitOptions) => {
  return createMiddleware(async (c, next) => {
    // ... rate limiting logic
    await next()
  })
}
```

### Type Inference Patterns

**Pattern 1: Inline generic on `createMiddleware`**
```typescript
const mw = createMiddleware<{ Variables: { token: string } }>(...)
```
Best for: Single middleware, self-contained types.

**Pattern 2: `createFactory` for shared Env**
```typescript
import { createFactory } from 'hono/factory'

type AppEnv = {
  Variables: { user: User; requestId: string }
  Bindings: { DB: D1Database }
}

const factory = createFactory<AppEnv>()
const authMiddleware = factory.createMiddleware(...)
const handlers = factory.createHandlers(authMiddleware, (c) => {
  // c.var.user is typed
})
```
Best for: Multiple middleware/handlers sharing the same Env. **This is the recommended pattern for honoforge packages.**

**Pattern 3: Module augmentation for global variables**
```typescript
declare module 'hono' {
  interface ContextVariableMap {
    requestId: string
  }
}
```
Best for: App-wide middleware where the variable is guaranteed to exist. Use sparingly — pollutes global type namespace.

**Pattern 4: Type accumulation through chaining**
```typescript
const app = new Hono()
  .use(authMiddleware)    // adds { user: User }
  .use(dbMiddleware)      // adds { db: DB }
  .get('/', (c) => {
    // c.var.user AND c.var.db are both typed
  })
```
Hono automatically merges `Variables` types when middleware is chained via `.use()`.

### Context API for Middleware Authors

| Method | Purpose | Type Safety |
|--------|---------|-------------|
| `c.set(key, value)` | Store per-request data | Typed via `ContextVariableMap` or generic |
| `c.get(key)` | Retrieve stored data | Typed |
| `c.var` | Shorthand for all variables | Typed union of all accumulated Variables |
| `c.req.valid(target)` | Get validated data | Typed via validator middleware |
| `c.req.header(name)` | Get request header | `string \| undefined` |
| `c.req.param(name)` | Get route param | Typed if route has params |
| `c.res.headers.set()` | Modify response headers | Standard Headers API |
| `c.json(data, status)` | Return JSON response | Typed status codes |
| `c.notFound()` | Return 404 | Typed via `NotFoundResponse` augmentation |

### Built-in Middleware (Subpath Exports)

These ship **inside** the `hono` package — no separate install needed:

| Subpath | Purpose | Notes |
|---------|---------|-------|
| `hono/basic-auth` | HTTP Basic Authentication | |
| `hono/bearer-auth` | Bearer Token Authentication | |
| `hono/cache` | Response caching | Security fix in v4.12.18 for Vary headers |
| `hono/compress` | Response compression (gzip/brotli) | |
| `hono/cookie` | Cookie parsing/setting | |
| `hono/cors` | CORS headers | |
| `hono/csrf` | CSRF protection | |
| `hono/etag` | ETag generation | |
| `hono/jwt` | JWT verification | Supports single-line PEM keys (v4.12.15) |
| `hono/jwk` | JWK verification | |
| `hono/logger` | Request logging | |
| `hono/request-id` | Request ID generation | |
| `hono/secure-headers` | Security headers (CSP, HSTS, etc.) | |
| `hono/timing` | Server-Timing header | |
| `hono/timeout` | Request timeout | |
| `hono/trailing-slash` | Trailing slash normalization | Added `skip` option in v4.12.13 |
| `hono/body-limit` | Request body size limiting | Security fix in v4.12.16 |
| `hono/ip-restriction` | IP allow/block listing | |
| `hono/method-override` | HTTP method override | |
| `hono/powered-by` | X-Powered-By header | |
| `hono/pretty-json` | Pretty-print JSON responses | |
| `hono/combine` | Combine multiple middleware | |
| `hono/validator` | Built-in validator | **DEPRECATED** — use third-party |
| `hono/factory` | `createMiddleware`, `createFactory` | **Essential for middleware authors** |
| `hono/http-exception` | HTTPException class | |
| `hono/adapter` | Runtime-agnostic `env()` helper | |
| `hono/testing` | `testClient` for testing | |
| `hono/client` | `hc()` type-safe RPC client | |
| `hono/ws` | WebSocket support | |

### `@hono/*` Middleware Packages (Separate Install)

| Package | Version | Peer Deps | Purpose |
|---------|---------|-----------|---------|
| `@hono/zod-validator` | 0.8.0 | `hono>=4.10.0`, `zod^3.25.0\|\|^4.0.0` | Zod validation |
| `@hono/zod-openapi` | 1.4.0 | `hono>=4.10.0`, `zod^4.0.0` | OpenAPI from Zod |
| `@hono/standard-validator` | 0.2.2 | `hono>=3.9.0`, `@standard-schema/spec^1.0.0` | Standard Schema validation |
| `@hono/valibot-validator` | 0.6.1 | `hono>=3.9.0`, `valibot^1.0.0` | Valibot validation |
| `@hono/typebox-validator` | 1.1.0 | `hono>=3.9.0`, `typebox^1.0.30` | TypeBox validation |
| `@hono/arktype-validator` | 2.0.1 | `hono*`, `arktype^2.0.0` | ArkType validation |
| `@hono/effect-validator` | 1.2.0 | `hono>=4.4.13`, `effect>=3.10.0` | Effect validation |
| `@hono/swagger-ui` | 0.6.1 | `hono>=4.0.0` | Swagger UI serving |
| `@hono/swagger-editor` | — | — | Swagger Editor serving |
| `@hono/otel` | 1.1.2 | `hono>=4.0.0` | OpenTelemetry tracing |
| `@hono/prometheus` | 1.0.3 | `hono>=3.0.0`, `prom-client^15.0.0` | Prometheus metrics |
| `@hono/sentry` | 1.2.2 | `hono>=3.*` | Sentry error tracking |
| `@hono/node-server` | 2.0.2 | `hono^4` | Node.js HTTP server |
| `@hono/react-renderer` | 1.0.1 | `hono*`, `react^19.0.0`, `react-dom^19.0.0` | SSR with React |
| `@hono/graphql-server` | 0.7.0 | `hono>=3.0.0` | GraphQL server |
| `@hono/oauth-providers` | — | — | OAuth2 providers |
| `@hono/oidc-auth` | — | — | OIDC authentication |
| `@hono/firebase-auth` | 1.4.2 | `hono*` | Firebase Auth |
| `@hono/clerk-auth` | — | — | Clerk Auth |
| `@hono/stytch-auth` | — | — | Stytch Auth |
| `@hono/cloudflare-access` | — | — | Cloudflare Access |
| `@hono/session` | — | — | Session management |
| `@hono/event-emitter` | 2.0.0 | `hono*` | Event-driven architecture |
| `@hono/structured-logger` | 0.1.0 | `hono>=4.0.0` | Structured logging (pino/winston) |
| `@hono/trpc-server` | — | — | tRPC server adapter |
| `@hono/mcp` | — | — | MCP server adapter |
| `@hono/eslint-config` | 2.1.0 | `eslint^9.0.0`, `typescript^5.0.0` | ESLint config |
| `@hono/vite-dev-server` | 0.25.3 | `hono*`, `miniflare*`, `wrangler*` | Vite dev server |

---

## Runtime Support Matrix

Hono runs on **any runtime that implements Web Standards** (`Request`, `Response`, `Headers`, `FetchEvent`):

| Runtime | Support Level | Adapter | Notes |
|---------|---------------|---------|-------|
| **Cloudflare Workers** | First-class | `hono/cloudflare-workers` | Primary target. Module Worker mode (`export default app`) |
| **Cloudflare Pages** | First-class | `hono/cloudflare-pages` | Uses `__STATIC_CONTENT_MANIFEST` for serveStatic |
| **Node.js** | First-class | `@hono/node-server` | Requires `@hono/node-server` for HTTP server |
| **Bun** | First-class | `hono/bun` | Native support, no adapter needed for basic use |
| **Deno** | First-class | `hono/deno` | Use JSR (`jsr:@hono/hono`), not `deno.land/x` |
| **Vercel Edge** | Supported | `hono/vercel` | Replaces deprecated `hono/nextjs` |
| **AWS Lambda** | Supported | `hono/aws-lambda` | Use `ApiGatewayRequestContextV2` |
| **Lambda@Edge** | Supported | `hono/lambda-edge` | CloudFront edge functions |
| **Netlify** | Supported | `hono/netlify` | Netlify Edge Functions |
| **Fastly Compute** | Supported | `@fastly/js-compute` | Via vitest project config |

**For honoforge:** Since the project targets zero runtime dependencies and peer deps only, all utilities should work across all runtimes. Avoid importing runtime-specific adapters (`hono/node-server`, etc.) in library code.

---

## Peer Dependency Conventions

### Pattern Analysis of `@hono/*` Packages

**Rule 1: Hono is always a peer dependency, never a runtime dependency**
Every `@hono/*` package declares `hono` in `peerDependencies`, never in `dependencies`. This ensures:
- No duplicate Hono installations
- Consumer controls Hono version
- Works in any runtime

**Rule 2: Validation libraries are peer dependencies**
Packages like `@hono/zod-validator` declare their validation library (`zod`, `valibot`, `typebox`, etc.) as peer dependencies. The library code imports from the peer, not a bundled copy.

**Rule 3: Runtime-specific dependencies go in `dependencies`**
`@hono/otel` includes `@opentelemetry/api` and `@opentelemetry/semantic-conventions` in `dependencies` (not peer deps) because these are implementation details the consumer doesn't need to manage directly.

**Rule 4: Version ranges vary by API stability**
- Newer packages targeting Hono 4.x features: `">=4.10.0"` or `">=4.0.0"`
- Mature packages stable since Hono 3.x: `">=3.9.0"` or `">=3.0.0"`
- Packages with no breaking changes expected: `"*"`

### Recommended Peer Dependencies for honoforge

```json
{
  "peerDependencies": {
    "hono": ">=4.10.0"
  },
  "peerDependenciesMeta": {
    "hono": {
      "optional": false
    }
  }
}
```

For packages that integrate with specific validators:
```json
{
  "peerDependencies": {
    "hono": ">=4.10.0",
    "zod": "^3.25.0 || ^4.0.0"
  }
}
```

---

## Build & Tooling Standards

### The Hono Middleware Monorepo Standard

The [honojs/middleware](https://github.com/honojs/middleware) monorepo establishes the de facto standard for building Hono ecosystem packages:

| Tool | Version | Purpose |
|------|---------|---------|
| **tsdown** | ^0.15.9 | Bundling (ESM + CJS + DTS) |
| **TypeScript** | ^5.9.3 | Type checking |
| **Vitest** | ^4.1.0-beta.1 | Testing |
| **ESLint** | ^10.0.3 | Linting |
| **Prettier** | ^3.8.1 | Formatting |
| **Changesets** | — | Versioning & publishing |

### tsdown Configuration (Standard)

```typescript
// tsdown.config.ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  attw: true,           // Are The Types Wrong? check
  clean: true,          // Clean dist before build
  dts: true,            // Generate .d.ts files
  entry: 'src/index.ts',
  format: ['cjs', 'esm'], // Dual ESM + CJS
  publint: true,        // Package linting
  tsconfig: 'tsconfig.build.json',
})
```

### Package.json Structure (Standard)

```json
{
  "name": "@honoforge/middleware",
  "version": "0.0.0",
  "type": "module",
  "main": "dist/index.js",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    "./package.json": "./package.json",
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsdown",
    "lint": "eslint",
    "typecheck": "tsc -b tsconfig.json",
    "test": "vitest",
    "format": "prettier --check ."
  },
  "publishConfig": {
    "registry": "https://registry.npmjs.org",
    "access": "public",
    "provenance": true
  }
}
```

### Key Build Conventions

1. **Dual ESM/CJS exports** — All `@hono/*` packages ship both formats via tsdown
2. **`.d.ts` and `.d.cts`** — Separate type declarations for ESM and CJS
3. **`"type": "module"`** — Package is ESM-first
4. **`"files": ["dist"]`** — Only ship the dist folder
5. **`publint: true`** — Run publint in build to catch packaging issues
6. **`attw: true`** — Run "Are The Types Wrong?" check in build
7. **Provenance publishing** — `publishConfig.provenance: true` for npm provenance

### honoforge Already Has

The project already uses **tsdown** for bundling, **Vitest** for testing, **TypeScript** for types, and **ESLint** for linting. This aligns perfectly with the Hono ecosystem standard.

---

## Recommendations

### What to Use

| Decision | Recommendation | Why |
|----------|---------------|-----|
| **Hono peer dep** | `">=4.10.0"` | Matches `@hono/zod-validator` and `@hono/zod-openapi`; ensures current API |
| **Bundler** | **tsdown** (already configured) | Ecosystem standard, dual ESM/CJS, DTS generation, attw + publint |
| **Test framework** | **Vitest** (already configured) | Ecosystem standard, Hono core and middleware both use it |
| **Middleware creation** | `createMiddleware` from `hono/factory` | Type-safe, recommended pattern |
| **Shared Env** | `createFactory<Env>()` from `hono/factory` | Avoids repeating generics across middleware |
| **Validation** | `@hono/standard-validator` for new code | Supports any `@standard-schema/spec` validator (Zod, Valibot, ArkType) |
| **OpenAPI** | `@hono/zod-openapi` | Official, maintained, integrates with `@hono/zod-validator` |
| **Package structure** | Dual ESM/CJS exports with separate `.d.ts`/`.d.cts` | Ecosystem standard |
| **Publishing** | npm provenance enabled | All `@hono/*` packages use it |
| **TypeScript** | ^5.9.x | Ecosystem standard, matches Hono's devDep |

### What to Avoid

| Anti-Pattern | Why | Alternative |
|-------------|-----|-------------|
| **`hono` in `dependencies`** | Causes duplicate Hono installs, breaks runtime compatibility | Always use `peerDependencies` |
| **`hono/validator` (built-in)** | Deprecated, will have breaking changes in next major | Use `@hono/zod-validator` or `@hono/standard-validator` |
| **`interface` for Env generics** | Breaking change since v3 — must use `type` | `type Env = { Variables: {...} }` |
| **`c.env()` helper** | Removed in v4.0.0 | Use `env()` from `hono/adapter` |
| **`c.jsonT()`, `c.stream()`** | Removed in v4.0.0 | Use `c.json()`, `stream()` from `hono/streaming` |
| **`deno.land/x` imports** | No longer published there | Use JSR: `jsr:@hono/hono` |
| **Runtime-specific imports in library code** | Breaks cross-runtime compatibility | Import from `hono` core only |
| **`"hono": "*"` peer dep** | Too loose, no API guarantees | Use `">=4.10.0"` minimum |
| **Bundling Hono with your package** | Breaks singleton patterns, doubles bundle size | Peer dep only |

### Architecture Recommendations for honoforge

1. **`@honoforge/core`** — Zero peer deps beyond `hono`. HTTP status codes, shared types, utility functions. No external dependencies.

2. **`@honoforge/middleware`** — Peer deps: `hono>=4.10.0`. Authentication, validation wrappers, error handling, rate limiting. Each middleware should use `createMiddleware` with typed generics.

3. **`@honoforge/openapi`** — Peer deps: `hono>=4.10.0`, `zod^3.25.0 || ^4.0.0`. Build on top of `@hono/zod-openapi` patterns. Use `@asteasolutions/zod-to-openapi` as a dependency (not peer dep) since it's an implementation detail.

4. **Monorepo structure** — Keep using pnpm workspaces. Each package gets its own `tsdown.config.ts`, `tsconfig.json`, and `vitest` config. Share ESLint config via `@hono/eslint-config` or custom config.

---

## Confidence Levels

| Area | Confidence | Reason |
|------|------------|--------|
| Hono version & exports | **HIGH** | Verified against npm registry and GitHub source |
| Middleware type signatures | **HIGH** | Verified against Hono source (`src/types.ts`) |
| Peer dependency conventions | **HIGH** | Analyzed 20+ `@hono/*` package.json files from GitHub |
| Build tooling (tsdown) | **HIGH** | Verified against middleware monorepo configs |
| Runtime support matrix | **HIGH** | Verified against Hono docs and subpath exports |
| Recent breaking changes | **HIGH** | Verified against GitHub releases and MIGRATION.md |
| `@hono/standard-validator` adoption | **MEDIUM** | New package (v0.2.2), limited ecosystem adoption yet |
| Recommended peer dep range | **HIGH** | Matches `@hono/zod-validator` and `@hono/zod-openapi` |
| tsdown as bundler standard | **HIGH** | All middleware monorepo packages use it |

---

## Sources

- **Hono npm package:** https://www.npmjs.com/package/hono (v4.12.18)
- **Hono GitHub:** https://github.com/honojs/hono
- **Hono Middleware Monorepo:** https://github.com/honojs/middleware
- **Hono Docs - Middleware:** https://hono.dev/docs/guides/middleware
- **Hono Docs - Factory:** https://hono.dev/docs/helpers/factory
- **Hono Docs - Best Practices:** https://hono.dev/docs/guides/best-practices
- **Hono Docs - Validation:** https://hono.dev/docs/guides/validation
- **Hono Migration Guide:** https://github.com/honojs/hono/blob/main/docs/MIGRATION.md
- **Hono Releases:** https://github.com/honojs/hono/releases
- **Context7 - Hono Middleware:** `/honojs/middleware`
- **Context7 - Hono Docs:** `/websites/hono_dev`
- **All `@hono/*` package.json files:** Fetched directly from GitHub raw content
