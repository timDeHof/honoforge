# honoforge — Domain Glossary

> Defines the domain terms used across the project. When a term appears in code, docs, or architecture discussions, it should map to one of these definitions.

## Core Domain

**Hono** — The web framework honoforge extends. A lightweight, ultrafast web framework for TypeScript/JavaScript, designed for edge runtimes (Cloudflare Workers, Bun, Deno) and Node.js.

**OpenAPIHono** — Hono extension from `@hono/zod-openapi` that adds OpenAPI 3.x documentation generation. Routes registered via `app.openapi()` are tracked in an internal registry.

**Registry** — The internal data structure on `OpenAPIHono` (`openAPIRegistry._definitions`) that stores all registered routes, schemas, and components. This is the single source of truth for what routes exist in an app.

**Route** — A registered endpoint on an `OpenAPIHono` instance, defined by method, path, request schema, and response schema.

## HTTP

**Status Code** — Numeric HTTP response code (e.g., `200`, `404`, `500`). honoforge provides typed constants via `HttpStatusCode`.

**Status Phrase** — Human-readable string equivalent of a status code (e.g., `"OK"`, `"Not Found"`). honoforge provides typed constants via `HttpPhrase`.

## Error Handling

**Problem Details** — RFC 9457 compliant error response format (`application/problem+json`). Contains `type`, `title`, `status`, `detail`, and optional `instance` and extension fields.

**Error Handler** — Hono's `ErrorHandler` function registered via `app.onError()`. honoforge provides `createErrorHandler()` that returns Problem Details responses.

**Error Formatter** — Functions that convert various error types (`Error`, `HTTPException`, strings, objects) into Problem Details objects.

## Middleware

**Middleware** — A function in the Hono request pipeline that can inspect, modify, or short-circuit requests. honoforge provides typed middleware via `ForgeMiddlewareHandler`.

**ForgeEnv** — The base environment type for honoforge middleware, providing `Variables` and `Bindings` slots for context augmentation.

**ForgeStorage** — Interface for key-value storage with TTL support. Used by middleware that needs rate limiting, caching, idempotency, or sessions.

## OpenAPI

**Schema** — OpenAPI 3.x schema object describing data types. honoforge converts Zod schemas to OpenAPI schemas via `zodToOpenAPI()`.

**Document** — Complete OpenAPI 3.1 specification object containing `openapi`, `info`, `paths`, and optional `components`.

**Serve** — HTTP endpoint that serves the generated OpenAPI document as JSON.

## Types

**ForgeMiddlewareHandler** — Typed alias for Hono's `MiddlewareHandler`, scoped to `ForgeEnv`.

**ExtendContext** — Type utility to augment a `ForgeEnv`'s `Variables` with new keys.

**ForgeVariables** — Type utility to extract the `Variables` type from a `ForgeEnv`.

**ForgeBindings** — Type utility to extract the `Bindings` type from a `ForgeEnv`.
