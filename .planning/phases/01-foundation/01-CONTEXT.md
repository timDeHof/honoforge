# Phase 1: Foundation & Core Package - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning
**Source:** Research + Requirements (no discuss-phase run)

<domain>
## Phase Boundary

Establish `@honoforge/core` as the foundation package with proper monorepo conventions, migrate existing HTTP status utilities, create shared type infrastructure (`ForgeEnv`, `ForgeMiddlewareHandler`, `ForgeStorage`), and set up build/CI pipeline following `@hono/*` ecosystem standards.

</domain>

<decisions>
## Implementation Decisions

### Package Structure
- `@honoforge/core` is the first package — all other packages depend on it
- Must follow `@hono/*` conventions: zero runtime deps, peer deps only, tsdown bundling, dual ESM/CJS exports
- Package must pass `attw` + `publint` verification before publishing
- `publishConfig.provenance: true` for npm provenance

### Peer Dependencies
- `hono: ">=4.10.0"` as peer dependency (matches `@hono/zod-validator` and `@hono/zod-openapi`)
- `hono` must NEVER be in `dependencies` — always `peerDependencies`
- Use `"hono": { "optional": false }` in `peerDependenciesMeta`

### Build Tooling
- tsdown for bundling (already configured) — dual ESM/CJS + DTS generation
- Vitest for testing (already configured)
- TypeScript strict mode (already configured)
- ESLint with `@antfu/eslint-config` (already configured)

### HTTP Status Migration
- Migrate existing `src/http-status-codes.ts` and `src/http-status-phrases.ts` into `@honoforge/core`
- Preserve JSDoc RFC references from existing files
- Export as typed numeric constants (codes) and string constants (phrases)

### Shared Types
- `ForgeEnv` type: shared Env interface with `Variables` and `Bindings` for honoforge middleware
- `ForgeMiddlewareHandler` type: typed middleware handler using `createMiddleware` pattern
- Type helpers for extending Hono context

### Storage Adapter
- `ForgeStorage` interface: unified storage adapter with `get`, `set`, `delete`, `ttl` methods
- Serves as foundation for future middleware (rate limiter, cache, idempotency)
- Interface-only in Phase 1 — implementations come in Phase 2

### Coding Standards
- Use `type` (not `interface`) for Env generics — Hono v4 requirement
- Always wrap middleware in `createMiddleware` from `hono/factory`
- Use `createFactory<AppEnv>()` for shared Env across middleware/handlers

### the agent's Discretion
- Exact file organization within `packages/core/src/` — follow existing `src/` structure as analog
- Whether to use barrel exports (`index.ts`) or direct imports — follow existing pattern
- Test file naming and organization — follow Vitest conventions
- CI workflow specifics — follow `@hono/*` monorepo patterns

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Research
- `.planning/research/STACK.md` — Technology stack, peer dep conventions, build standards
- `.planning/research/PITFALLS.md` — 26 domain pitfalls, 8 mapped to Phase 1
- `.planning/research/SUMMARY.md` — Executive summary, phase rationale
- `.planning/REQUIREMENTS.md` — v1 requirements (CORE-01 through CORE-04)
- `.planning/ROADMAP.md` — Phase goals and success criteria

### Existing Code (Migration Sources)
- `src/http-status-codes.ts` — Existing HTTP status codes (migration source for CORE-01)
- `src/http-status-phrases.ts` — Existing HTTP status phrases (migration source for CORE-02)
- `package.json` — Current package config (baseline for monorepo restructuring)
- `tsconfig.json` — Current TypeScript config (baseline)
- `tsdown.config.ts` — Current tsdown config (baseline)

</canonical_refs>

<specifics>
## Specific Ideas

- Phase 1 addresses pitfalls 2, 6, 11, 12, 13, 23, 25, 26 from PITFALLS.md
- Current project is a single package — needs restructuring to monorepo with `packages/core/`
- Existing `src/http-status-codes.ts` has 60+ constants with JSDoc RFC references — migrate as-is
- Existing `src/http-status-phrases.ts` has 60+ string constants — migrate as-is
- `scripts/update-http-statuses.ts` exists for regenerating status files
- `tsdown-stale-guard` plugin is already in use
</specifics>

<deferred>
## Deferred Ideas

- Rate limiter, cache adapter, structured logger, idempotency middleware — v2 (Phase 2)
- OpenAPI utilities — Phase 2
- Error handling middleware — Phase 2
- Testing utilities, cross-runtime CI — Phase 5 (research suggested) or v2

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-05-11 via research synthesis*
