# Architecture Patterns: Hono Utility Libraries & Middleware

**Domain:** Hono ecosystem package architecture
**Researched:** 2026-05-11
**Sources:** honojs/hono@v4.12.18, honojs/middleware (main), @hono/zod-openapi@1.4.0, @hono/zod-validator@0.8.0

---

## Package Structure Conventions

### Two-Tier Architecture

Hono has a deliberate split between **core** and **third-party** packages:

| Tier | Repository | Namespace | Dependency Policy |
|------|-----------|-----------|-------------------|
| **Core** | `honojs/hono` | `hono` (no scope) | Zero external deps — Web Standards only |
| **Third-party** | `honojs/middleware` | `@hono/*` | Can depend on external libraries (zod, swagger-ui, etc.) |

### Core Package (`honojs/hono`) Directory Structure

```
hono/
├── src/
│   ├── index.ts              # Main entry — exports Hono class
│   ├── hono-base.ts          # HonoBase class (routing, dispatch, middleware chain)
│   ├── context.ts            # Context class (c.set, c.get, c.json, c.var)
│   ├── request.ts            # HonoRequest (c.req)
│   ├── types.ts              # All type definitions (Env, Handler, MiddlewareHandler, etc.)
│   ├── hono.ts               # Hono class (extends HonoBase)
│   ├── middleware/             # Built-in middleware (zero external deps)
│   │   ├── basic-auth/index.ts
│   │   ├── bearer-auth/index.ts
│   │   ├── cors/index.ts
│   │   ├── jwt/index.ts
│   │   ├── logger/index.ts
│   │   └── ... (15+ middleware)
│   ├── helper/               # Helpers (called directly, not in middleware chain)
│   │   ├── factory/index.ts  # createMiddleware, createFactory, createHandlers
│   │   ├── testing/index.ts  # testClient()
│   │   ├── cookie/index.ts
│   │   ├── css/index.ts
│   │   ├── html/index.ts
│   │   └── ssg/index.ts
│   ├── utils/                # Internal utilities
│   │   ├── types.ts          # UnionToIntersection, Simplify, JSONParsed, etc.
│   │   ├── url.ts            # mergePath, etc.
│   │   └── http-status.ts    # StatusCode definitions
│   ├── client/               # hc type-safe client
│   ├── router/               # RegExpRouter, TrieRouter, etc.
│   ├── adapter/              # Platform adapters (cloudflare, node, bun, etc.)
│   └── preset/               # Tiny/quick presets
├── build/
│   └── build.ts              # Custom Bun + esbuild build script
├── package.json              # 60+ subpath exports
└── tsconfig.build.json
```

### Third-Party Package (`honojs/middleware`) Directory Structure

```
middleware/                          # Yarn 4 workspace monorepo
├── package.json                     # Root workspace config
├── packages/
│   ├── zod-openapi/
│   │   ├── src/
│   │   │   ├── index.ts            # Single entry — OpenAPIHono class + types
│   │   │   └── zod-typeguard.ts    # Internal helper
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── test/                   # Colocated or sibling test files
│   ├── zod-validator/
│   │   ├── src/
│   │   │   ├── index.ts            # zValidator function
│   │   │   └── utils.ts            # Internal utility types
│   │   └── package.json
│   ├── session/
│   ├── oauth-providers/
│   ├── prometheus/
│   ├── mcp/
│   └── ... (20+ packages)
├── .github/actions/                 # Shared CI actions (also workspace packages)
└── turbo.json                       # Turborepo for parallel builds
```

### Individual Package `package.json` Convention

Every `@hono/*` package follows this exact pattern:

```json
{
  "name": "@hono/zod-openapi",
  "version": "1.4.0",
  "type": "module",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
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
    "test": "vitest",
    "typecheck": "tsc -b tsconfig.json",
    "lint": "eslint",
    "format": "prettier --check ."
  },
  "peerDependencies": {
    "hono": ">=4.10.0",
    "zod": "^4.0.0"
  },
  "dependencies": {
    "@asteasolutions/zod-to-openapi": "^8.5.0",
    "@hono/zod-validator": "workspace:^"
  },
  "devDependencies": {
    "hono": "^4.11.5",
    "tsdown": "^0.15.9",
    "typescript": "^5.9.3",
    "vitest": "^4.1.0-beta.1",
    "zod": "^4.2.1"
  },
  "publishConfig": {
    "registry": "https://registry.npmjs.org",
    "access": "public",
    "provenance": true
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/honojs/middleware.git",
    "directory": "packages/zod-openapi"
  }
}
```

**Key conventions:**
- `"type": "module"` — ESM-first
- Dual ESM/CJS exports via conditional exports
- `hono` as **peerDependency** (not dependency) — avoids version conflicts
- Internal packages use `"workspace:^"` for cross-package references
- `tsdown` for bundling (modern, fast, replaces esbuild for middleware packages)
- `vitest` for testing (with `@cloudflare/vitest-pool-workers` for edge runtime tests)
- `repository.directory` field points to monorepo subdirectory

---

## Export Patterns & API Design

### Core Package: Subpath Exports (60+ entry points)

The core `hono` package uses subpath exports for tree-shaking:

```json
{
  "exports": {
    ".": { "types": "./dist/types/index.d.ts", "import": "./dist/index.js" },
    "./types": { "types": "./dist/types/types.d.ts", "import": "./dist/types.js" },
    "./factory": { "types": "./dist/types/helper/factory/index.d.ts", "import": "./dist/helper/factory/index.js" },
    "./cors": { "types": "./dist/types/middleware/cors/index.d.ts", "import": "./dist/middleware/cors/index.js" },
    "./logger": { "types": "./dist/types/middleware/logger/index.d.ts", "import": "./dist/middleware/logger/index.js" },
    "./validator": { "types": "./dist/types/validator/index.d.ts", "import": "./dist/validator/index.js" },
    "./testing": { "types": "./dist/types/helper/testing/index.d.ts", "import": "./dist/helper/testing/index.js" },
    "./client": { "types": "./dist/types/client/index.d.ts", "import": "./dist/client/index.js" }
  }
}
```

**User import patterns:**
```typescript
import { Hono } from 'hono'                    // Core class
import { cors } from 'hono/cors'               // Built-in middleware
import { logger } from 'hono/logger'           // Built-in middleware
import { createMiddleware } from 'hono/factory' // Factory helpers
import { testClient } from 'hono/testing'      // Testing helper
import { validator } from 'hono/validator'     // Validation helper
import type { MiddlewareHandler, Env } from 'hono/types'  // Type-only imports
```

### Third-Party Package: Single Entry Point

`@hono/*` packages export everything from a single entry:

```typescript
// User imports
import { OpenAPIHono, createRoute, zValidator } from '@hono/zod-openapi'
import { zValidator } from '@hono/zod-validator'
import { sessionMiddleware } from '@hono/session'
```

### Middleware API Design Pattern

All middleware follows the **factory function** pattern — a function that returns a `MiddlewareHandler`:

```typescript
// Simple middleware (no type extension)
export const cors = (options?: CORSOptions): MiddlewareHandler => {
  return async function cors(c, next) {
    // ... logic
    await next()
  }
}

// Type-extending middleware (adds Variables)
export const authMiddleware = createMiddleware<{
  Variables: { user: User }
}>(async (c, next) => {
  const user = await authenticate(c)
  c.set('user', user)
  await next()
})
```

**Key design rule:** Middleware should `await next()` and return nothing to continue the chain, or return a `Response` to short-circuit.

---

## Type Inference Architecture

### The Env Type System

Hono's entire type system revolves around the `Env` interface:

```typescript
// From hono/src/types.ts
export type Bindings = object      // Platform bindings (Cloudflare env vars, etc.)
export type Variables = object      // Middleware-set context variables

export type Env = {
  Bindings?: Bindings
  Variables?: Variables
}
```

### Type Accumulation via `IntersectNonAnyTypes`

When middleware is chained, Hono accumulates their `Env` types using this recursive utility:

```typescript
// From hono/src/types.ts
type ProcessHead<T> = IfAnyThenEmptyObject<T extends Env ? (Env extends T ? {} : T) : T>

export type IntersectNonAnyTypes<T extends any[]> = T extends [infer Head, ...infer Rest]
  ? ProcessHead<Head> & IntersectNonAnyTypes<Rest>
  : {}
```

**How it works:**
1. Each middleware declares its `Env` via generics: `MiddlewareHandler<{ Variables: { user: User } }>`
2. When you chain `.use(mw1).use(mw2).get('/', handler)`, Hono builds up: `IntersectNonAnyTypes<[Env, Env1, Env2, Env3]>`
3. `ProcessHead` filters out `any` types (prevents type pollution) and `Env extends T ? {} : T` filters out empty `Env`
4. The result is an intersection of all Variables: `{ user: User } & { db: DB } & { session: Session }`

### Handler Overload Pattern (up to 10 handlers)

Hono uses explicit overloads (not rest parameters with inference) for handler chains. Each overload:
- Accepts N handlers with incrementally accumulated Env types
- Returns a new `HonoBase` with the final intersected Env
- Merges `Input` types: `I2 extends Input = I`, `I3 extends Input = I & I2`, etc.

```typescript
// Simplified from hono/src/types.ts — app.get(handler x3)
<E2 extends Env = E, E3 extends Env = IntersectNonAnyTypes<[E, E2]>,
 E4 extends Env = IntersectNonAnyTypes<[E, E2, E3]>>(
  handler1: H<E2, P, I>,
  handler2: H<E3, P, I2>,
  handler3: H<E4, P, I3, R>
): HonoBase<IntersectNonAnyTypes<[E, E2, E3, E4]>, S & ToSchema<...>, BasePath, CurrentPath>
```

### Context Variable Access (`c.var`)

The `Context` class provides typed access via `c.var`:

```typescript
// From hono/src/context.ts
interface Get<E extends Env> {
  <Key extends keyof E['Variables']>(key: Key): E['Variables'][Key]
  <Key extends keyof ContextVariableMap>(key: Key): ContextVariableMap[Key]
}

// c.var is a proxy that uses Get<E> for type safety
// c.get('user') and c.var.user are both type-safe
```

### Module Augmentation Pattern

Users can extend `ContextVariableMap` via declaration merging:

```typescript
declare module 'hono' {
  interface ContextVariableMap {
    user: User
    requestId: string
  }
}
```

This provides global type safety without per-middleware generics but loses the incremental accumulation benefit.

### The Factory Pattern for Reusable Middleware

`hono/factory` provides `createMiddleware`, `createFactory`, and `createHandlers`:

```typescript
// createMiddleware — type-safe middleware factory
const mw = createMiddleware<{ Variables: { foo: string } }>(async (c, next) => {
  c.set('foo', 'bar')
  await next()
})

// createFactory — creates a factory with pre-configured Env
const factory = createFactory()
const mw = factory.createMiddleware(async (c, next) => {
  c.set('foo', 'bar')
  await next()
})

// createHandlers — creates handler arrays with proper type accumulation
const handlers = factory.createHandlers(logger(), mw, (c) => {
  return c.json(c.var.foo)  // Type-safe!
})
app.get('/api', ...handlers)
```

---

## Component Boundaries

### Core Hono Package Components

| Component | Responsibility | Location | Imports Via |
|-----------|---------------|----------|-------------|
| **Hono/HonoBase** | App class, routing, dispatch, middleware chain | `src/hono-base.ts`, `src/hono.ts` | `hono` |
| **Context** | Request/response handling, `c.set`/`c.get`/`c.var`, response helpers | `src/context.ts` | `hono` |
| **HonoRequest** | Request parsing, validated data access | `src/request.ts` | `hono` |
| **Types** | Env, Handler, MiddlewareHandler, Schema, TypedResponse | `src/types.ts` | `hono/types` |
| **Router** | RegExpRouter, TrieRouter, SmartRouter | `src/router/` | Internal |
| **Built-in Middleware** | cors, jwt, basic-auth, logger, etc. (zero deps) | `src/middleware/` | `hono/cors`, etc. |
| **Factory** | createMiddleware, createFactory, createHandlers | `src/helper/factory/` | `hono/factory` |
| **Validator** | `validator()` function for target validation | `src/validator/` | `hono/validator` |
| **Testing** | `testClient()` — wraps `hc` with custom fetch | `src/helper/testing/` | `hono/testing` |
| **Client (hc)** | Type-safe HTTP client | `src/client/` | `hono/client` |
| **Utils** | UnionToIntersection, Simplify, mergePath, etc. | `src/utils/` | `hono/utils/types` (internal) |

### Third-Party Middleware Component Pattern

Each `@hono/*` package typically has these internal layers:

```
@hono/zod-openapi/
├── Public API
│   ├── OpenAPIHono class        # Extends Hono, adds .openapi(), .doc(), .doc31()
│   ├── createRoute()            # Route definition factory
│   ├── defineOpenAPIRoute()     # Typed route definition
│   ├── $()                      # Hono→OpenAPIHono type converter
│   └── Types                    # RouteConfig, RouteHandler, Hook, etc.
├── Internal
│   ├── Type mappers             # InputTypeBase, RouteConfigToTypedResponse, etc.
│   ├── Validator auto-generation # Auto-creates zValidator calls from RouteConfig
│   └── Document generators      # getOpenAPIDocument, getOpenAPI31Document
└── Dependencies
    ├── @asteasolutions/zod-to-openapi  # OpenAPI spec generation
    ├── @hono/zod-validator             # Validation middleware
    └── openapi3-ts                     # OpenAPI type definitions
```

### Middleware vs Helper Distinction

| Aspect | Middleware | Helper |
|--------|-----------|--------|
| **Execution** | In request pipeline (before/after handler) | Called directly in handler code |
| **Pattern** | `app.use(middleware())` | `const data = getCookie(c, 'token')` |
| **Return** | `await next()` or `Response` | Return value (data, string, etc.) |
| **Type extension** | Can add Variables to Env | Cannot extend Env |
| **Examples** | cors, jwt, logger | cookie, html, css, testClient |

---

## Data Flow Diagram

### Middleware Chain Execution (Onion Model)

```
Request →
  │
  ▼
┌─────────────────────────────────────────────────┐
│  Middleware 1 (registered first)                │
│  ┌─ BEFORE next()                               │
│  │   • Log request start                        │
│  │   • Set c.set('startTime', Date.now())       │
│  │                                              │
│  ▼                                              │
│  ┌───────────────────────────────────────────┐  │
│  │  Middleware 2                             │  │
│  │  ┌─ BEFORE next()                        │  │
│  │  │   • Validate JWT                       │  │
│  │  │   • c.set('user', decodedUser)         │  │
│  │  │                                        │  │
│  │  ▼                                        │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │  Middleware 3                       │  │  │
│  │  │  ┌─ BEFORE next()                  │  │  │
│  │  │  │   • Rate limit check             │  │  │
│  │  │  │   • c.set('rateLimit', info)     │  │  │
│  │  │  │                                  │  │  │
│  │  │  ▼                                  │  │  │
│  │  │  ┌───────────────────────────────┐  │  │  │
│  │  │  │  HANDLER (endpoint)           │  │  │  │
│  │  │  │  • c.var.user → typed access  │  │  │  │
│  │  │  │  • c.var.rateLimit → typed    │  │  │  │
│  │  │  │  • return c.json(data, 200)   │  │  │  │
│  │  │  └───────────────────────────────┘  │  │  │
│  │  │                                      │  │  │
│  │  │  ▲ AFTER next() returns              │  │  │
│  │  │  • (nothing — rate limit passed)     │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  │                                            │  │
│  │  ▲ AFTER next() returns                   │  │
│  │  • (nothing — auth passed)                │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  ▲ AFTER next() returns                         │
│  • c.res.headers.set('X-Response-Time', ...)    │
│  • Log request end                              │
└─────────────────────────────────────────────────┘
  │
  ▼
Response → Client
```

### Type Flow (Compile-Time)

```
new Hono()
  │  Env = {}
  │
  ├─ .use(authMiddleware)
  │    authMiddleware: MiddlewareHandler<{ Variables: { user: User } }>
  │    → New Hono instance with Env = { Variables: { user: User } }
  │
  ├─ .use(dbMiddleware)
  │    dbMiddleware: MiddlewareHandler<{ Variables: { db: DB } }>
  │    → New Hono instance with Env = { Variables: { user: User } & { db: DB } }
  │
  └─ .get('/', handler)
       handler receives Context<{ Variables: { user: User; db: DB } }>
       → c.var.user is typed as User
       → c.var.db is typed as DB
       → Schema accumulates: { '/': { $get: { input: {}, output: ..., status: 200 } } }
```

### @hono/zod-openapi Data Flow

```
createRoute({ method, path, request: { params, query, body }, responses })
  │
  │  RouteConfig (declarative route definition)
  │
  ▼
app.openapi(route, handler, hook)
  │
  ├─ 1. Register route in OpenAPIRegistry (for doc generation)
  │
  ├─ 2. Auto-generate zValidator middleware for each target:
  │     • route.request.params  → zValidator('param', schema)
  │     • route.request.query   → zValidator('query', schema)
  │     • route.request.body    → zValidator('json', schema)
  │     • route.request.headers → zValidator('header', schema)
  │     • route.request.cookies → zValidator('cookie', schema)
  │
  ├─ 3. Prepend route-level middleware (route.middleware)
  │
  ├─ 4. Register with this.on([method], [path], ...validators, ...routeMiddleware, handler)
  │
  └─ 5. Return new OpenAPIHono with merged Schema (for RPC type inference)

app.doc('/openapi', config)
  │
  └─ Generates OpenAPI JSON document from OpenAPIRegistry.definitions
```

---

## Suggested Build Order

### For a Hono Utility Library Monorepo

```
Phase 1: Core Types & Utilities
├── src/types.ts          — Env, Variables, Handler, MiddlewareHandler definitions
├── src/utils/types.ts    — UnionToIntersection, Simplify, IntersectNonAnyTypes
└── Build: TypeScript declaration files only (no runtime code needed yet)

Phase 2: Middleware Base
├── Individual middleware packages (each independent)
│   ├── package.json (workspace references)
│   ├── src/index.ts (createMiddleware pattern)
│   └── test/index.test.ts
├── Build: tsdown per package (parallelizable via turbo)
└── Depends on: Phase 1 types

Phase 3: Validation Layer
├── zod-validator wrapper (or equivalent)
├── Type-safe validation middleware
└── Depends on: Phase 2 (middleware base), hono/validator

Phase 4: OpenAPI Integration
├── OpenAPIHono class (extends Hono)
├── createRoute, defineOpenAPIRoute factories
├── Auto-validator generation from RouteConfig
├── Document generation (.doc, .doc31)
└── Depends on: Phase 3 (validation), @asteasolutions/zod-to-openapi

Phase 5: Testing Helpers
├── testClient wrapper
├── Mock context utilities
└── Depends on: Phase 2 (middleware), hono/testing, hono/client
```

**Build system recommendation:**
- Use **tsdown** for individual package bundling (what @hono/* uses)
- Use **Turborepo** for parallel task orchestration (what honojs/middleware uses)
- Use **Vitest** with `@cloudflare/vitest-pool-workers` for edge runtime testing
- Use **Changesets** for versioning and publishing (what honojs/middleware uses)
- TypeScript project references (`tsc -b`) for type checking across packages

---

## Recommendations for honoforge Architecture

### Package Structure

```
honoforge/
├── package.json              # Root workspace (yarn/pnpm)
├── turbo.json                # Task orchestration
├── packages/
│   ├── core/                 # Core types and base utilities
│   │   ├── src/
│   │   │   ├── index.ts      # Re-exports
│   │   │   ├── types.ts      # Env, ForgeEnv, Handler types
│   │   │   └── utils/        # Type utilities
│   │   └── package.json
│   ├── middleware/           # Individual middleware (published as @honoforge/*)
│   │   ├── auth/
│   │   ├── validation/
│   │   └── ...
│   ├── openapi/              # OpenAPI integration
│   │   ├── src/
│   │   │   ├── index.ts      # ForgeAPI class (extends Hono or OpenAPIHono)
│   │   │   ├── route.ts      # createForgeRoute
│   │   │   └── types.ts      # RouteConfig, etc.
│   │   └── package.json
│   └── testing/              # Test utilities
│       ├── src/
│       │   └── index.ts      # testForgeClient, mockContext
│       └── package.json
└── tsconfig.base.json        # Shared TypeScript config
```

### Key Architectural Decisions

1. **Follow the factory pattern** — All middleware should be factory functions returning `MiddlewareHandler`. Use `createMiddleware` from `hono/factory` for type safety.

2. **Use `peerDependencies` for hono** — Never bundle hono. Declare `"hono": ">=4.10.0"` as peerDependency to avoid version conflicts.

3. **Single entry point per package** — Unlike core hono's 60+ subpath exports, each `@honoforge/*` package should have one `exports: { ".": ... }` entry. Keep it simple.

4. **Dual ESM/CJS via tsdown** — Use conditional exports with both `import` and `require` conditions. tsdown handles both formats automatically.

5. **Type accumulation via Env generics** — Every middleware that sets context variables MUST declare `{ Variables: { ... } }` in its generic parameter. This enables downstream type inference.

6. **Avoid RoR-style controllers** — Follow Hono's best practice: write handlers inline after route definitions, not as separate controller functions. Use `factory.createHandlers()` if you need to extract handler arrays.

7. **OpenAPI: extend OpenAPIHono, not Hono** — If building OpenAPI support, extend `OpenAPIHono` from `@hono/zod-openapi` rather than building from scratch. The type machinery for `RouteConfig → TypedResponse` mapping is complex and battle-tested.

8. **Testing: wrap testClient** — Don't build a custom test runner. Wrap `testClient` from `hono/testing` which already provides type-safe client access via `hc`.

9. **Workspace dependencies for internal packages** — Use `"@honoforge/core": "workspace:^"` pattern for cross-package references. This ensures local development uses source, not published versions.

10. **Build in dependency order** — Core types first, then middleware (parallel), then openapi (depends on middleware), then testing. Turborepo handles this automatically with `dependsOn` configuration.

### Type Inference Strategy for honoforge

```typescript
// 1. Define your extended Env
export type ForgeEnv = {
  Bindings: {
    DATABASE_URL: string
    API_KEY: string
  }
  Variables: {
    requestId: string
    tenant: Tenant
  }
}

// 2. Create a factory with pre-configured Env
import { createFactory } from 'hono/factory'
export const forgeFactory = createFactory<ForgeEnv>()

// 3. Middleware that extends Variables
export const tenantMiddleware = forgeFactory.createMiddleware<{
  Variables: { tenant: Tenant }
}>(async (c, next) => {
  const tenant = await resolveTenant(c)
  c.set('tenant', tenant)
  await next()
})

// 4. Handlers with full type inference
export const handlers = forgeFactory.createHandlers(
  tenantMiddleware,
  (c) => {
    // c.var.tenant is typed as Tenant — no cast needed
    return c.json({ tenant: c.var.tenant })
  }
)
```

### Pitfall: The "Middle Middleware" Type Bug

Hono has a known issue (#3587) where type inference breaks for middleware in the **middle** of a chain when not using `createMiddleware`. The fix: always wrap middleware in `createMiddleware<{ Variables: ... }>()` or use `factory.createMiddleware()`.

```typescript
// BAD — middle middleware loses type inference
app.get('/ws',
  createMiddleware<UserContext>(async (c, next) => { ... }),
  async (c, next) => { /* c is BlankEnv here! */ },  // ← Bug
  async (c, next) => { /* c is UserContext again */ }
)

// GOOD — all middleware wrapped
app.get('/ws',
  createMiddleware<UserContext>(async (c, next) => { ... }),
  createMiddleware(async (c, next) => { /* c inherits UserContext */ }),
  async (c, next) => { /* c has full type */ }
)
```
