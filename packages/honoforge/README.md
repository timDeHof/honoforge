# @timdehof/honoforge

> Forge type-safe APIs at the speed of flame.

A collection of utilities for the [Hono](https://hono.dev/) ecosystem — OpenAPI schema conversion, route metadata extraction, and RFC 9457 Problem Details error handling.

## Installation

```bash
npm install @timdehof/honoforge
```

**Peer dependencies:**

- `hono` >= 4.10.0
- `zod` ^3.25.0 || ^4.0.0 (optional)
- `@hono/zod-openapi` >= 1.4.0 (optional)

## Usage

### Core

```ts
import type { ForgeEnv, ForgeMiddlewareHandler, ForgeStorage } from "@timdehof/honoforge";

import { HttpStatusCode } from "@timdehof/honoforge";

// Typed HTTP status codes
HttpStatusCode.OK; // 200
HttpStatusCode.NOT_FOUND; // 404
HttpStatusCode.INTERNAL_SERVER_ERROR; // 500

// Type infrastructure for Hono middleware
type AppEnv = ForgeEnv & {
  Variables: { user: User };
};

const authMiddleware: ForgeMiddlewareHandler<AppEnv> = async (c, next) => {
  const user = await authenticate(c.req.header("Authorization"));
  c.set("user", user);
  await next();
};
```

### OpenAPI (`@timdeof/honoforge/openapi`)

```ts
import { z } from "zod";

import { extractRouteMetadata, generateOpenAPIDoc, zodToOpenAPI } from "@timdehof/honoforge/openapi";

// Convert Zod schemas to OpenAPI 3.x
const schema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

const openapiSchema = zodToOpenAPI(schema);
// { type: 'object', properties: { id: { type: 'string' }, ... }, required: ['id', 'name', 'email'] }

// Route metadata extraction
const routes = extractRouteMetadata(app);

// OpenAPI document generation
const doc = generateOpenAPIDoc(app, {
  title: "My API",
  version: "1.0.0",
});
```

### Middleware (`@timdehof/honoforge/middleware`)

```ts
import { createErrorHandler, formatError } from "@timdehof/honoforge/middleware";

// Global error handling (recommended)
const app = new Hono();
app.onError(createErrorHandler());

// Manual error formatting
const problem = formatError(new Error("Something went wrong"));
// { type: 'about:blank', title: 'Error', status: 500, detail: 'Something went wrong' }

// Production mode — sanitizes 5xx error details
app.onError(createErrorHandler({ isProduction: true }));
```

## Subpath Exports

| Import                           | Description                                             |
| -------------------------------- | ------------------------------------------------------- |
| `@timdehof/honoforge`            | Core: HTTP status codes, types, storage interface       |
| `@timdehof/honoforge/openapi`    | OpenAPI schema conversion, route metadata, docs helpers |
| `@timdehof/honoforge/middleware` | RFC 9457 error handler, error formatting utilities      |

## Features

- **Zero runtime overhead** — type-level utilities with minimal runtime code
- **Dual ESM/CJS** — works in Node.js, Bun, and Cloudflare Workers
- **TypeScript-first** — full type inference with Hono's type system
- **RFC 9457 compliant** — Problem Details error responses (`application/problem+json`)
- **OpenAPI 3.x** — Zod-to-OpenAPI conversion supporting 25+ Zod types

## License

MIT
