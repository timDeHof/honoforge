# honoforge

## What This Is

A collection of scoped utility packages for the Hono ecosystem — middleware helpers, OpenAPI utilities, testing tools, and dev tooling. Built to make building type-safe APIs with Hono faster, safer, and more ergonomic.

## Core Value

**Ship type-safe Hono APIs with zero runtime overhead.** Every utility is designed to enhance developer experience without adding dependencies or runtime cost.

## Context

Currently a pnpm monorepo with a single package (`honoforge`) containing:

- `src/http-status-codes.ts` — Typed numeric HTTP status code constants with JSDoc RFC references
- `src/http-status-phrases.ts` — Typed string phrase equivalents for human-readable responses
- `src/middlewares/` — (empty, to be populated)
- `src/openapi/` — (empty, to be populated)

Tooling already configured: TypeScript, tsdown (bundling), vitest (testing), ESLint (linting).

## Requirements

### Validated

- ✓ HTTP status codes as typed numeric constants — existing
- ✓ HTTP status phrases as typed string constants — existing
- ✓ pnpm monorepo structure — existing
- ✓ TypeScript + tsdown + vitest + ESLint tooling — existing

### Active

- [ ] Scoped npm packages (`@honoforge/core`, `@honoforge/middleware`, `@honoforge/openapi`)
- [ ] Zero runtime dependencies (peer deps only)
- [ ] Middleware utilities (auth, validation, error handling, rate limiting)
- [ ] OpenAPI utilities (schema generators, response builders, doc helpers)
- [ ] Monorepo-wide versioned releases
- [ ] Open-source npm publishing

### Out of Scope

- [ ] Runtime framework dependencies — all utilities must be zero-dependency at runtime
- [ ] Non-Hono ecosystem support — focused exclusively on Hono and `@hono/zod-openapi`

## Key Decisions

| Decision                         | Rationale                                                       | Outcome                    |
| -------------------------------- | --------------------------------------------------------------- | -------------------------- |
| Scoped packages (`@honoforge/*`) | Clean separation, independent installability, clear ownership   | Scoped packages            |
| Monorepo-wide versioning         | Simplified release process, consistent API surface              | All packages share version |
| Zero runtime dependencies        | No supply chain risk, minimal bundle size, works in any runtime | Peer deps only             |
| Middleware + OpenAPI first       | Highest value gaps in Hono ecosystem                            | Priority order             |

## Packages (Planned)

### `@honoforge/core`

- HTTP status codes and phrases (migrate from current `honoforge`)
- Shared type utilities, constants, and helpers
- Foundation package that other packages depend on

### `@honoforge/middleware`

- Authentication middleware (JWT, API keys, session)
- Request validation helpers
- Error handling and formatting
- Rate limiting
- Logging and tracing
- CORS and security headers

### `@honoforge/openapi`

- OpenAPI schema generators from Zod schemas
- Response builders with typed status codes
- Documentation helpers
- Route metadata extraction

### Future Packages

- `@honoforge/testing` — Testing utilities, mock helpers, request/response builders
- `@honoforge/devtools` — Dev tooling, CLI helpers, scaffolding

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):

1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):

1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

_Last updated: 2026-05-11 after initialization_
