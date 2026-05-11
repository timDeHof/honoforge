# honoforge — v1 Requirements

## v1 Requirements

### Core Utilities (`@honoforge/core`)

- [ ] **CORE-01**: HTTP status codes as typed numeric constants — migrate existing `http-status-codes.ts` with full JSDoc RFC references
- [ ] **CORE-02**: HTTP status phrases as typed string constants — migrate existing `http-status-phrases.ts`
- [ ] **CORE-03**: Shared type utilities — `ForgeEnv`, `ForgeMiddlewareHandler`, type helpers for extending Hono context
- [ ] **CORE-04**: Storage adapter interface — unified `ForgeStorage` interface (get, set, delete, ttl) as foundation for future middleware

### OpenAPI Utilities (`@honoforge/openapi`)

- [ ] **OPENAPI-01**: Schema generators from Zod schemas — convert Zod schemas to OpenAPI 3.x schema objects
- [ ] **OPENAPI-02**: Typed response builders — helper functions that return typed responses with correct status codes and OpenAPI metadata
- [ ] **OPENAPI-03**: Route metadata extraction — utilities to extract and inspect route metadata from `OpenAPIHono` instances
- [ ] **OPENAPI-04**: OpenAPI documentation helpers — helpers for generating and serving OpenAPI JSON/YAML docs

### Error Handling Middleware (`@honoforge/middleware`)

- [ ] **ERR-01**: RFC 9457 Problem Details error handler middleware — catches unhandled errors and returns standardized `application/problem+json` responses
- [ ] **ERR-02**: Error formatting utilities — convert `Error`, `HTTPError`, and custom error types to Problem Details format

## v2 Requirements (Deferred)

### Middleware

- Rate limiting middleware
- Cache adapter (Redis/memory for Node.js, Web Cache API for edge)
- Structured logger with levels
- Idempotency key middleware
- Webhook signature verification
- Circuit breaker
- Request deduplication
- API versioning helpers
- Response transformation pipeline

### Testing

- Test request/response builders
- Mock context helpers
- Integration test utilities

## Out of Scope

- Runtime framework dependencies — all utilities must be zero-dependency at runtime
- Non-Hono ecosystem support — focused exclusively on Hono and `@hono/zod-openapi`
- ORM, template engines, WebSocket, auth providers, GraphQL servers — already covered by `@hono/*`

## Traceability

| Requirement | Phase   | Status  |
| ----------- | ------- | ------- |
| CORE-01     | Phase 1 | Pending |
| CORE-02     | Phase 1 | Pending |
| CORE-03     | Phase 1 | Pending |
| CORE-04     | Phase 1 | Pending |
| OPENAPI-01  | Phase 2 | Pending |
| OPENAPI-02  | Phase 2 | Pending |
| OPENAPI-03  | Phase 2 | Pending |
| OPENAPI-04  | Phase 2 | Pending |
| ERR-01      | Phase 2 | Pending |
| ERR-02      | Phase 2 | Pending |
