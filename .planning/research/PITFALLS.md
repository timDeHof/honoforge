# Domain Pitfalls: Hono Utility Libraries & Middleware

**Domain:** Hono middleware and `@hono/*`-style package development
**Researched:** 2026-05-11

---

## Type System Pitfalls

### Pitfall 1: "Type instantiation is excessively deep and possibly infinite" (TS2589)

**What goes wrong:** Hono's RPC type system instantiates deeply nested generic types for every route. With 50+ routes, `tsserver` hits TypeScript's instantiation limit and the IDE becomes unusable. This is the single most reported type issue in the Hono ecosystem — at least 10 GitHub issues (#663, #1216, #1360, #1921, #2270, #2399, #3494, #3893, #4143, #4775).

**Why it happens:** Each `.get()`, `.post()`, etc. call returns a new `HonoBase` with accumulated generic type parameters. The type instantiation grows quadratically with route count. `tsserver` re-instantiates these types on every keystroke.

**Consequences:** IDE becomes unresponsive, type checking fails, CI may pass but local dev is broken.

**Prevention:**
- **Compile client types at build time** (recommended): Export `type Client = ReturnType<typeof hc<typeof app>>` and use a typed wrapper function instead of raw `hc<AppType>()`
- **Explicit type arguments**: `app.get<'foo/:id'>('foo/:id', handler)` — specify just the path type to skip full instantiation
- **Split into multiple clients**: Create per-domain clients (`authorsClient`, `booksClient`) instead of one monolithic `AppType`
- **Use `hono/tiny` preset** for smaller apps — fewer subpath exports = less type surface area

**Detection:** `tsserver` CPU spikes above 100%, "Type instantiation is excessively deep" errors in IDE, slow autocomplete (>2s delay).

**Phase:** Phase 4 (OpenAPI Integration) — this is where route count explodes and type performance matters most.

---

### Pitfall 2: Hono Version Mismatch Between Client and Server

**What goes wrong:** When frontend and backend live in different packages (monorepo or separate repos), using different Hono versions causes `_brand` type mismatches. The `Hono` class has a private `_brand` property that differs between versions, making `typeof app` incompatible across version boundaries.

**Why it happens:** Hono uses branded types internally for type safety. Different versions have different brand values.

**Consequences:** `hc<typeof app>` produces `never` or `unknown` types. RPC client loses all type safety silently.

**Prevention:**
- **Pin exact Hono version** in monorepo root `package.json` with `resolutions`/`overrides`
- **Use TypeScript project references** so frontend compiles against backend types at build time
- **Never use `*` or broad ranges** like `>=3.0.0` for Hono in client packages

**Detection:** `hc<typeof app>` returns `unknown` or `never`. Type errors like "Type 'Hono<...>' is not assignable to type 'Hono<...>'" despite identical-looking generics.

**Phase:** Phase 1 (Foundation) — enforce version pinning from day one.

---

### Pitfall 3: Middleware Loses Type Inference in the Middle of a Chain

**What goes wrong:** When middleware is not wrapped in `createMiddleware`, type inference breaks for subsequent middleware in the chain. The middle handler gets `BlankEnv` instead of accumulated types.

**Why it happens:** Hono's overload resolution only accumulates types from handlers that explicitly declare their `Env` generic. Raw async functions without type annotations default to `BlankEnv`.

**Consequences:** `c.var.user` becomes `any` or `unknown` in handlers after the unwrapped middleware.

**Prevention:**
- **Always wrap middleware in `createMiddleware`** or `factory.createMiddleware()`
- **Use `createFactory<AppEnv>()`** to create a typed factory — all middleware and handlers inherit the Env automatically
- **Never write raw async functions** in middleware chains without explicit type annotations

**Detection:** `c.var` shows `any` or missing properties in IDE. TypeScript shows "Property 'user' does not exist on type 'BlankEnv'".

**Phase:** Phase 2 (Middleware Base) — enforce this pattern in every middleware package.

---

### Pitfall 4: `c.notFound()` Breaks RPC Client Type Inference

**What goes wrong:** When a handler returns `c.notFound()`, the RPC client cannot infer the 404 response shape. `res.json()` returns `unknown` on the client side.

**Why it happens:** `c.notFound()` doesn't carry typed response information into the Schema type. The client has no way to know what shape the 404 body has.

**Consequences:** Client-side code loses type safety for error responses. Developers must manually cast or use `as`.

**Prevention:**
- **Use `c.json({ error: 'not found' }, 404)`** instead of `c.notFound()` — explicitly typed status codes work with RPC
- **Use `ApplyGlobalResponse` type helper** to merge global error types into all routes
- **Module augmentation**: Extend `NotFoundResponse` interface to declare the 404 shape globally

**Detection:** `await res.json()` returns `unknown` in client code. IDE shows no autocomplete for error response properties.

**Phase:** Phase 4 (OpenAPI Integration) — error response typing is critical for OpenAPI specs.

---

### Pitfall 5: Zod Version Conflicts in Validator Middleware

**What goes wrong:** `@hono/zod-validator` v0.8.0 supports `zod ^3.25.0 || ^4.0.0`. Zod v4 has breaking type changes. If a project uses Zod v3 but the middleware was compiled against Zod v4 types (or vice versa), type inference silently breaks.

**Why it happens:** The peer dependency range is intentionally broad. Zod v3 and v4 have different type signatures for `ZodType`, `infer`, and schema methods.

**Consequences:** Validator middleware accepts schemas but `c.req.valid('json')` returns wrong types. No runtime error — just silent type unsafety.

**Prevention:**
- **Pin Zod version** in monorepo root alongside Hono
- **Test against both Zod v3 and v4** in CI if supporting both ranges
- **Use `@hono/standard-validator`** for new code — it uses the `@standard-schema/spec` interface which is version-agnostic

**Detection:** `c.req.valid()` returns unexpected types. Zod schema validation passes but inferred type doesn't match actual runtime shape.

**Phase:** Phase 3 (Validation Layer) — validator compatibility must be tested before release.

---

### Pitfall 6: `interface` vs `type` for Env Generics

**What goes wrong:** Since Hono v4, you must use `type` (not `interface`) for Env type definitions. Using `interface` causes type inference failures.

**Why it happens:** Hono's internal type utilities (`IntersectNonAnyTypes`, `ProcessHead`) rely on type-level operations that work with `type` aliases but not with `interface` declarations.

**Consequences:** Middleware Variables don't accumulate. `c.var` shows empty object.

**Prevention:**
- **Always use `type Env = { Variables: {...} }`** — never `interface`
- **ESLint rule**: Add a lint rule forbidding `interface` for Env-like types

**Detection:** `c.var` is typed as `{}` despite middleware calling `c.set()`. No TypeScript error — just missing types.

**Phase:** Phase 1 (Foundation) — codify in project ESLint config.

---

## Architecture Pitfalls

### Pitfall 7: Combining `OpenAPIHono` with Plain `Hono` Instances

**What goes wrong:** Mounting `OpenAPIHono` sub-apps inside plain `Hono` instances causes OpenAPI spec loss. Plain `Hono` doesn't know about OpenAPI definitions. Conversely, `OpenAPIHono` won't "dig" into deeply nested plain `Hono` branches.

**Why it happens:** `OpenAPIHono` merges definitions from direct subapps only. Plain `Hono` has no concept of OpenAPI registries.

**Consequences:** Routes exist and work at runtime, but don't appear in generated OpenAPI spec. Documentation is incomplete.

**Prevention:**
- **Use `OpenAPIHono` at the top level** and migrate downward through the router tree
- **Never mount `OpenAPIHono` inside plain `Hono`** — always the reverse
- **Use Hono `:param` syntax** (not OpenAPI `{param}`) in parent route paths when mounting child apps

**Detection:** OpenAPI spec is missing routes that work fine at runtime. `app.openAPIRegistry` doesn't contain expected definitions.

**Phase:** Phase 4 (OpenAPI Integration) — architecture decision that's hard to undo.

---

### Pitfall 8: RoR-Style Controllers Break Type Inference

**What goes wrong:** Extracting handlers into separate "controller" functions (like Ruby on Rails) loses path parameter and context type inference. `c.req.param('id')` returns `string | undefined` instead of the inferred type.

**Why it happens:** Hono's type inference happens at the route definition site. Separating the handler breaks the connection between path pattern and handler function.

**Consequences:** Manual type assertions needed in controllers. End-to-end type safety is lost.

**Prevention:**
- **Write handlers inline** after route definitions (Hono's recommended pattern)
- **Use `factory.createHandlers()`** if extraction is necessary — it preserves type accumulation
- **Use `app.route()`** for file separation, not controller extraction

**Detection:** `c.req.param()` returns `string | undefined` instead of specific string literal types. Handler functions need explicit `Context<...>` type annotations.

**Phase:** Phase 2 (Middleware Base) — establish coding standards early.

---

### Pitfall 9: Header Keys Must Be Lowercase in OpenAPI Schemas

**What goes wrong:** Defining header schemas with capitalized keys (`Authorization`) in `@hono/zod-openapi` causes validation failures or silent mismatches.

**Why it happens:** HTTP headers are case-insensitive at the protocol level, but Hono normalizes them to lowercase internally. OpenAPI schemas must match the lowercase form.

**Consequences:** Header validation fails silently or produces unexpected results.

**Prevention:**
- **Always use lowercase header keys** in Zod schemas: `{ authorization: z.string() }` not `{ Authorization: z.string() }`
- **Document this convention** in package README

**Detection:** Header validation returns `{}` or fails for headers that should pass.

**Phase:** Phase 4 (OpenAPI Integration) — affects all header-based validation.

---

### Pitfall 10: `defaultHook` Not Picked Up in Nested Routes

**What goes wrong:** Setting `defaultHook` on an `OpenAPIHono` instance doesn't propagate to nested/mounted routes. Validation errors in child routes use default behavior instead of the configured hook.

**Why it happens:** This is a known open bug (#1306 in honojs/middleware). The `defaultHook` is scoped to the instance where it's defined, not inherited by sub-apps.

**Consequences:** Inconsistent error responses across the API. Some routes return custom error format, others return default.

**Prevention:**
- **Set `defaultHook` on every `OpenAPIHono` instance** — don't rely on inheritance
- **Use per-route hooks** for critical routes instead of relying on `defaultHook`
- **Test error responses** for all mounted routes, not just top-level ones

**Detection:** Some routes return custom error format while others return default Zod error shape.

**Phase:** Phase 4 (OpenAPI Integration) — test error handling across all route levels.

---

## Dependency Pitfalls

### Pitfall 11: Bundling Hono Instead of Using Peer Dependency

**What goes wrong:** Including `hono` in `dependencies` instead of `peerDependencies` causes duplicate Hono installations. This breaks singleton patterns (middleware registration, type branding) and doubles bundle size.

**Why it happens:** Developers treating Hono like Express (which you install as a dependency) rather than understanding its peer-dep-only convention.

**Consequences:** Two Hono instances in the same process. Middleware registered on one doesn't affect the other. Type branding mismatches. Bundle size bloat.

**Prevention:**
- **Always declare `hono` in `peerDependencies`** — never in `dependencies`
- **Run `publint` and `attw`** in build pipeline — both catch this
- **Use `npm ls hono`** to verify single installation

**Detection:** `npm ls hono` shows multiple versions. Middleware behavior is inconsistent. Bundle analysis shows duplicate Hono code.

**Phase:** Phase 1 (Foundation) — enforce in package template and CI.

---

### Pitfall 12: Too-Loose Peer Dependency Ranges (`"hono": "*"`)

**What goes wrong:** Several `@hono/*` packages use `"hono": "*"` as peer dependency (basic-auth, arktype-validator, event-emitter, firebase-auth, bun-transpiler). This means the package claims compatibility with Hono v1 through v5+, which is false.

**Why it happens:** Convenience — avoids updating peer deps on every Hono release. But Hono v4.0.0 had massive breaking changes (removed `c.jsonT()`, `c.env()`, `app.head()`, etc.).

**Consequences:** Package appears compatible but fails at runtime with newer Hono versions. No install-time warning.

**Prevention:**
- **Use `">=4.10.0"` minimum** — matches `@hono/zod-validator` and `@hono/zod-openapi`
- **Test against Hono minor version bumps** in CI
- **Update peer dep range** when relying on new Hono APIs

**Detection:** Runtime errors like "c.env is not a function" or "c.jsonT is not a function" after Hono upgrade.

**Phase:** Phase 1 (Foundation) — set correct ranges from the start.

---

### Pitfall 13: Missing `exports` Field for `package.json`

**What goes wrong:** Not including `"./package.json": "./package.json"` in the `exports` field breaks tooling that reads package metadata (npm, pnpm, bundlers).

**Why it happens:** When `exports` is defined, Node.js restricts all imports to only what's listed. If `package.json` isn't exported, tools can't read it.

**Consequences:** `npm pack` warnings, bundler resolution failures, JSR publishing issues.

**Prevention:**
- **Always include `"./package.json": "./package.json"`** as the first export entry
- **Follow the exact exports pattern** from `@hono/*` packages

**Detection:** `publint` warns about missing package.json export. Some bundlers fail to resolve the package.

**Phase:** Phase 1 (Foundation) — bake into package template.

---

### Pitfall 14: Deno/JSR Version Mismatch Between Hono and Middleware

**What goes wrong:** In Deno, importing `Hono` from `jsr:@hono/hono@4.4.0` and middleware from `jsr:@hono/hono@4.4.5/deno` causes runtime failures. The versions must match exactly.

**Why it happens:** Deno/JSR treats each version as a separate module. Middleware compiled against one Hono version may access internal APIs that changed in another.

**Consequences:** Runtime errors in Deno deployments. Works fine in Node.js/Bun but breaks on edge runtimes.

**Prevention:**
- **Pin exact versions** in Deno import maps
- **Test on Deno** in CI, not just Node.js
- **Document Deno-specific import patterns** in README

**Detection:** Works locally on Node.js, fails on Cloudflare Workers or Deno Deploy with type/runtime errors.

**Phase:** Phase 5 (Testing) — cross-runtime testing catches this.

---

## Performance Pitfalls

### Pitfall 15: IDE Performance Degrades with Route Count

**What goes wrong:** Each route adds type instantiation work for `tsserver`. With 100+ routes, IDE autocomplete takes 5-10 seconds. This is documented as a known issue (#2399, still open).

**Why it happens:** Hono's type system instantiates full generic types for every route on every type check. No caching across type checks.

**Consequences:** Developer productivity drops. CI type checking slows. Large apps become painful to work with.

**Prevention:**
- **Pre-compile client types**: `export type Client = ReturnType<typeof hc<typeof app>>` — moves instantiation to compile time
- **Split routes into sub-apps** with separate client instances
- **Use `hono/tiny`** preset for smaller bundle and fewer type exports
- **Manual type arguments** for hot paths: `app.get<'/users/:id'>('/users/:id', handler)`

**Detection:** `tsserver` process uses >2GB RAM. Autocomplete latency >2s. Type errors appear after 30s delay.

**Phase:** Phase 4 (OpenAPI Integration) — plan route organization strategy before route count grows.

---

### Pitfall 16: Unnecessary Compression on Cloudflare Workers

**What goes wrong:** Using `hono/compress` middleware on Cloudflare Workers or Deno Deploy is redundant — these runtimes compress responses automatically. The middleware adds CPU overhead for no benefit.

**Why it happens:** Developers applying Express/Fastify patterns (always add compression) without understanding edge runtime behavior.

**Consequences:** Wasted CPU cycles on edge runtimes. Slightly increased latency.

**Prevention:**
- **Don't use `hono/compress` on Cloudflare Workers or Deno Deploy**
- **Only use on Node.js** where automatic compression isn't available
- **Use `@hono/bun-compress`** for Brotli on Bun (built-in `hono/compress` only does gzip)

**Detection:** Response is double-compressed. CPU usage higher than expected on edge deployments.

**Phase:** Phase 2 (Middleware Base) — document runtime-specific behavior.

---

### Pitfall 17: Built-in Cache Middleware Doesn't Work on Node.js

**What goes wrong:** `hono/cache` uses the Web Cache API, which is only available on edge runtimes (Cloudflare Workers, Deno). On Node.js, the cache middleware silently does nothing.

**Why it happens:** The Web Cache API is a Web Standard not implemented in Node.js. Hono's cache middleware doesn't fall back to memory/Redis.

**Consequences:** Node.js deployments have no caching. Performance degrades under load. No error message — just silent failure.

**Prevention:**
- **Build a universal cache adapter** that detects runtime and uses appropriate backend (Web Cache API on edge, Redis/memory on Node.js)
- **Document the limitation** clearly
- **Test cache behavior** on each target runtime

**Detection:** Cache headers present but no actual caching occurs on Node.js. Response times identical with and without cache middleware.

**Phase:** Phase 2 (Middleware Base) — this is the #1 Node.js gap (issue #3857).

---

### Pitfall 18: Timeout Middleware Incompatible with Streaming

**What goes wrong:** `hono/timeout` cannot be used with SSE or streaming responses. The timeout fires while the stream is still writing, causing premature termination.

**Why it happens:** The timeout middleware wraps the entire handler in `Promise.race`. Streaming handlers never "complete" until the stream closes, so the timeout always wins.

**Consequences:** SSE connections drop unexpectedly. Streaming responses are truncated.

**Prevention:**
- **Don't use `hono/timeout` on streaming routes**
- **Use `except()` from `hono/combine`** to exclude streaming paths
- **Manual timeout management** for streaming: track stream open time and close manually

**Detection:** SSE clients receive unexpected disconnects. Streaming responses cut off mid-transfer.

**Phase:** Phase 2 (Middleware Base) — document incompatibility.

---

## OpenAPI Pitfalls

### Pitfall 19: Missing `Content-Type` Causes Silent Empty Validation

**What goes wrong:** When a POST request lacks the proper `Content-Type` header, `c.req.valid('json')` returns `{}` instead of the validated data. No validation error is thrown — the handler receives an empty object.

**Why it happens:** `@hono/zod-openapi` only validates when `Content-Type` matches the schema's content type. Without it, validation is skipped entirely.

**Consequences:** Handlers process empty data silently. No error response. Data corruption.

**Prevention:**
- **Set `request.body.required: true`** in route config — forces validation even without proper `Content-Type`
- **Add a Content-Type checking middleware** before validation
- **Test with missing Content-Type** in integration tests

**Detection:** POST requests with JSON body but no `Content-Type: application/json` header produce empty objects in handlers.

**Phase:** Phase 4 (OpenAPI Integration) — critical for API correctness.

---

### Pitfall 20: `$()` Type Converter Needed After Chaining

**What goes wrong:** Methods like `.get()`, `.post()`, `.use()` on `OpenAPIHono` return `Hono` type, not `OpenAPIHono`. After chaining, you lose access to `.openapi()`, `.doc()`, and other OpenAPI methods.

**Why it happens:** Hono's method overloads return the base `Hono` type for type compatibility. `OpenAPIHono`'s additional methods aren't reflected in the return type.

**Consequences:** Can't call `.openapi()` after `.use(middleware)`. TypeScript error: "Property 'openapi' does not exist on type 'Hono'".

**Prevention:**
- **Use `$()` function** to convert back: `const app = $(new OpenAPIHono().use(mw))`
- **Use `HonoToOpenAPIHono` utility type** for type-level conversion
- **Chain `.openapi()` calls first**, then add middleware

**Detection:** TypeScript error after chaining: "Property 'openapi' does not exist on type 'Hono<...>'".

**Phase:** Phase 4 (OpenAPI Integration) — affects every route registration.

---

### Pitfall 21: OpenAPI Route Path Syntax Mismatch with Hono Routing

**What goes wrong:** Using OpenAPI `{param}` syntax in `.route()` parent paths doesn't match Hono's `:param` routing. Routes are registered but never matched.

**Why it happens:** OpenAPI uses `{param}` for path parameters, but Hono uses `:param`. When mounting child apps, the parent path must use Hono syntax.

**Consequences:** Routes exist in OpenAPI spec but return 404 at runtime.

**Prevention:**
- **Use `:param` in `.route()` paths**: `app.route('/books/:bookId', bookApp)` not `'/books/{bookId}'`
- **Use `{param}` only in `createRoute` path definitions**
- **Test mounted routes** with actual HTTP requests, not just type checking

**Detection:** OpenAPI spec shows route, but curl returns 404.

**Phase:** Phase 4 (OpenAPI Integration) — affects all mounted sub-apps.

---

### Pitfall 22: `zod-to-openapi` Schema Registration Conflicts

**What goes wrong:** `@hono/zod-openapi` depends on `@asteasolutions/zod-to-openapi` for schema generation. If multiple packages register schemas with the same name, the OpenAPI spec gets corrupted with conflicting definitions.

**Why it happens:** The `OpenAPIRegistry` is a singleton-like object. Schema names must be globally unique across the entire application.

**Consequences:** OpenAPI spec has wrong schema definitions. Swagger UI shows incorrect types.

**Prevention:**
- **Namespace schema names**: `UserCreate`, `UserUpdate` instead of just `User`
- **Use `.openapi('UniqueName')`** consistently
- **Audit schema names** across packages before merging

**Detection:** Swagger UI shows wrong schema for an endpoint. OpenAPI JSON has duplicate schema names with different definitions.

**Phase:** Phase 4 (OpenAPI Integration) — naming convention needed early.

---

## DX & Documentation Pitfalls

### Pitfall 23: Missing `repository.directory` Field in Monorepo Packages

**What goes wrong:** When publishing from a monorepo, npm can't link back to the correct source directory without the `repository.directory` field. Issues, PRs, and source links on npmjs.com point to the monorepo root instead of the package.

**Why it happens:** Easy to forget in monorepo setups. Not required for publishing, only for discoverability.

**Consequences:** Users can't find source code from npm page. Bug reports go to wrong location.

**Prevention:**
- **Always include `repository.directory`** in monorepo package.json
- **Include `homepage`** pointing to monorepo root

**Detection:** npmjs.com "Repository" link points to monorepo root, not package subdirectory.

**Phase:** Phase 1 (Foundation) — bake into package template.

---

### Pitfall 24: No Examples for Runtime-Specific Usage

**What goes wrong:** Documentation shows examples for one runtime (usually Cloudflare Workers) but doesn't mention differences for Node.js, Bun, or Deno. Users on other runtimes hit silent failures.

**Why it happens:** Hono's marketing emphasizes edge runtimes. Documentation examples default to Cloudflare Workers patterns.

**Consequences:** Node.js users copy-paste Worker examples and get runtime errors. Confusion about which imports to use.

**Prevention:**
- **Document runtime differences** for every middleware
- **Provide examples for Node.js, Bun, and Cloudflare Workers** at minimum
- **Use runtime detection** in examples: `if (typeof Bun !== 'undefined')`

**Detection:** GitHub issues tagged with "Node.js" or "Bun" for features that work on Workers.

**Phase:** Phase 5 (Testing) — documentation review before each release.

---

### Pitfall 25: No Provenance Publishing

**What goes wrong:** Publishing packages without npm provenance means users can't verify the published package matches the source code. Security-conscious teams reject packages without provenance.

**Why it happens:** Requires CI configuration (OIDC token from GitHub Actions). Easy to skip for new packages.

**Consequences:** Enterprise users can't adopt. Supply chain security audits flag the package.

**Prevention:**
- **Set `publishConfig.provenance: true`** in package.json
- **Configure OIDC publishing** in GitHub Actions
- **All `@hono/*` packages use provenance** — follow the standard

**Detection:** npmjs.com package page doesn't show "Provenance" badge.

**Phase:** Phase 1 (Foundation) — configure CI pipeline from day one.

---

### Pitfall 26: Missing `attw` and `publint` in Build Pipeline

**What goes wrong:** Without running "Are The Types Wrong?" (`attw`) and `publint` in the build, packages ship with broken type declarations or incorrect package structure.

**Why it happens:** These tools are optional. Developers test functionality but not package structure.

**Consequences:** Consumers get "Cannot find module" errors, wrong type declarations, or ESM/CJS mismatch. Issues are hard to debug because the package looks correct but resolution fails.

**Prevention:**
- **Run `attw: true` and `publint: true`** in tsdown config
- **Fail CI** if either tool reports errors
- **All `@hono/*` packages use both** — ecosystem standard

**Detection:** `npx attw` or `npx publint` reports errors. Consumers report "module not found" or type resolution failures.

**Phase:** Phase 1 (Foundation) — configure in tsdown template.

---

## Phase Mapping

| Pitfall | Category | Phase | Severity |
|---------|----------|-------|----------|
| 1. Type instantiation depth (TS2589) | Type System | Phase 4 | **Critical** |
| 2. Hono version mismatch (client/server) | Type System | Phase 1 | **Critical** |
| 3. Middleware loses type in chain | Type System | Phase 2 | High |
| 4. `c.notFound()` breaks RPC types | Type System | Phase 4 | High |
| 5. Zod version conflicts | Type System | Phase 3 | High |
| 6. `interface` vs `type` for Env | Type System | Phase 1 | Medium |
| 7. OpenAPIHono + plain Hono mixing | Architecture | Phase 4 | **Critical** |
| 8. RoR-style controllers | Architecture | Phase 2 | Medium |
| 9. Header keys must be lowercase | Architecture | Phase 4 | Medium |
| 10. `defaultHook` not inherited | Architecture | Phase 4 | Medium |
| 11. Bundling Hono (not peer dep) | Dependency | Phase 1 | **Critical** |
| 12. Too-loose peer dep ranges | Dependency | Phase 1 | High |
| 13. Missing package.json export | Dependency | Phase 1 | Medium |
| 14. Deno/JSR version mismatch | Dependency | Phase 5 | Medium |
| 15. IDE performance with routes | Performance | Phase 4 | High |
| 16. Unnecessary compression on Workers | Performance | Phase 2 | Low |
| 17. Cache middleware doesn't work on Node.js | Performance | Phase 2 | **Critical** |
| 18. Timeout incompatible with streaming | Performance | Phase 2 | Medium |
| 19. Missing Content-Type silent failure | OpenAPI | Phase 4 | **Critical** |
| 20. `$()` converter needed after chaining | OpenAPI | Phase 4 | High |
| 21. Path syntax mismatch (`{}` vs `:`) | OpenAPI | Phase 4 | High |
| 22. Schema name conflicts | OpenAPI | Phase 4 | Medium |
| 23. Missing repository.directory | DX | Phase 1 | Low |
| 24. No runtime-specific examples | DX | Phase 5 | Medium |
| 25. No provenance publishing | DX | Phase 1 | Medium |
| 26. Missing attw/publint in CI | DX | Phase 1 | High |

### Phase-by-Phase Summary

**Phase 1 (Foundation):** Address pitfalls 2, 6, 11, 12, 13, 23, 25, 26 — package setup, dependency conventions, CI configuration. These are the easiest to get wrong and hardest to fix later.

**Phase 2 (Middleware Base):** Address pitfalls 3, 8, 16, 17, 18 — middleware patterns, runtime-specific behavior, documentation of limitations.

**Phase 3 (Validation Layer):** Address pitfall 5 — Zod version compatibility, validator adapter patterns.

**Phase 4 (OpenAPI Integration):** Address pitfalls 1, 4, 7, 9, 10, 15, 19, 20, 21, 22 — the most pitfalls cluster here because OpenAPI combines type complexity, architecture decisions, and runtime behavior.

**Phase 5 (Testing & Release):** Address pitfalls 14, 24 — cross-runtime testing, documentation completeness.

---

## Sources

- **Hono RPC Known Issues (IDE performance):** https://hono.dev/docs/guides/rpc#known-issues
- **Hono Best Practices (no controllers):** https://hono.dev/docs/guides/best-practices
- **Hono Middleware Docs:** https://hono.dev/docs/guides/middleware
- **Hono Factory Helper:** https://hono.dev/docs/helpers/factory
- **@hono/zod-openapi README:** https://github.com/honojs/middleware/tree/main/packages/zod-openapi
- **@hono/zod-validator package.json:** https://github.com/honojs/middleware/blob/main/packages/zod-validator/package.json
- **GitHub Issue #2399:** Type instantiation performance (open): https://github.com/honojs/hono/issues/2399
- **GitHub Issue #2270:** RPC types not shareable (closed): https://github.com/honojs/hono/issues/2270
- **GitHub Issue #1306:** defaultHook not picked up in nested routes (open): https://github.com/honojs/middleware/issues/1306
- **GitHub Issue #1307:** Type inference not working with zod-openapi and path parameters (open): https://github.com/honojs/middleware/issues/1307
- **GitHub Issue #3857:** Cache middleware limited to Web Cache API: https://github.com/honojs/hono/issues/3857
- **GitHub Issue #4775:** Deno + JSR type conflicts: https://github.com/honojs/hono/issues/4775
- **Hono v4 Migration Guide:** https://github.com/honojs/hono/blob/main/docs/MIGRATION.md
