# honoforge

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![License][license-src]][license-href]

> Forge type-safe APIs at the speed of flame.

**honoforge** is a utility library for [Hono](https://hono.dev/) and [`@hono/zod-openapi`](https://github.com/honojs/middleware/tree/main/packages/zod-openapi). It provides typed HTTP status codes and phrases, middleware utilities, and OpenAPI helpers to build robust, type-safe APIs with confidence.

## Features

- **HTTP Status Codes** — Typed numeric status code constants (`OK`, `NOT_FOUND`, `INTERNAL_SERVER_ERROR`, etc.) with full JSDoc documentation linking to RFC specifications.
- **HTTP Status Phrases** — Typed string phrase equivalents (`"OK"`, `"Not Found"`, `"Internal Server Error"`, etc.) for human-readable responses.
- **Middleware Utilities** — Composable middleware helpers for Hono applications.
- **OpenAPI Integration** — Helpers designed to work seamlessly with `@hono/zod-openapi`.
- **Tree-shakeable** — Zero side-effects, fully optimized for production bundles.
- **TypeScript First** — Built with TypeScript, exports full type declarations.

## Install

```bash
npm install honoforge
# or
pnpm add honoforge
# or
yarn add honoforge
```

## Usage

### HTTP Status Codes

```ts
import { httpStatusCodes } from "honoforge";

// Use typed numeric status codes
app.get("/users/:id", (c) => {
  const user = findUser(c.req.param("id"));
  if (!user) {
    return c.json({ error: "User not found" }, httpStatusCodes.NOT_FOUND);
  }
  return c.json(user, httpStatusCodes.OK);
});
```

### HTTP Status Phrases

```ts
import { httpStatusPhrases } from "honoforge";

// Use typed string phrases for human-readable responses
console.log(httpStatusPhrases.OK); // "OK"
console.log(httpStatusPhrases.NOT_FOUND); // "Not Found"
console.log(httpStatusPhrases.IM_A_TEAPOT); // "I'm a teapot"
```

### Middlewares

```ts
import { middlewares } from "honoforge";

// Composable middleware utilities for Hono
app.use("*", middlewares.example());
```

## API Reference

### `httpStatusCodes`

All standard HTTP status codes as typed numeric constants. Each constant includes JSDoc documentation with links to the official RFC specification.

| Code | Constant                | Description                                         |
| ---- | ----------------------- | --------------------------------------------------- |
| 200  | `OK`                    | Request succeeded                                   |
| 201  | `CREATED`               | Resource created                                    |
| 202  | `ACCEPTED`              | Request accepted for processing                     |
| 400  | `BAD_REQUEST`           | Invalid request syntax                              |
| 401  | `UNAUTHORIZED`          | Authentication required                             |
| 403  | `FORBIDDEN`             | Access denied                                       |
| 404  | `NOT_FOUND`             | Resource not found                                  |
| 429  | `TOO_MANY_REQUESTS`     | Rate limit exceeded                                 |
| 500  | `INTERNAL_SERVER_ERROR` | Server error                                        |
| ...  | ...                     | [All HTTP status codes](./src/http-status-codes.ts) |

### `httpStatusPhrases`

Human-readable string equivalents for all HTTP status codes.

```ts
import { httpStatusPhrases } from "honoforge";

httpStatusPhrases.OK; // "OK"
httpStatusPhrases.CREATED; // "Created"
httpStatusPhrases.BAD_REQUEST; // "Bad Request"
httpStatusPhrases.UNPROCESSABLE_ENTITY; // "Unprocessable Entity"
```

### `middlewares`

Composable middleware utilities for Hono applications.

```ts
import { middlewares } from "honoforge";
```

## Scripts

| Command                     | Description                            |
| --------------------------- | -------------------------------------- |
| `pnpm build`                | Build the package                      |
| `pnpm dev`                  | Watch mode build                       |
| `pnpm test`                 | Run tests with Vitest                  |
| `pnpm lint`                 | Lint with ESLint                       |
| `pnpm typecheck`            | Type check with TypeScript             |
| `pnpm release`              | Bump version and release               |
| `pnpm update-http-statuses` | Update HTTP status codes from upstream |

## Contributing

Please refer to [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE) License © [timDeHof](https://github.com/timDeHof)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/honoforge?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/honoforge
[npm-downloads-src]: https://img.shields.io/npm/dm/honoforge?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/honoforge
[bundle-src]: https://img.shields.io/bundlephobia/minzip/honoforge?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=honoforge
[license-src]: https://img.shields.io/github/license/timDeHof/honoforge.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/timDeHof/honoforge/blob/main/LICENSE
