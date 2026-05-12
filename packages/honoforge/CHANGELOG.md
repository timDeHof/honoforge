# @timdehof/honoforge

## 0.2.3

### Patch Changes

- Fix missing dist directory in published npm package. The previous release
  (0.2.2) was published without the built dist files, causing "Cannot find
  module" errors for consumers.

## 0.2.2

### Patch Changes

- 5b7e1c3: Add README.md to published package.

## 0.2.1

### Patch Changes

- a908076: Fix TypeScript errors: resolve ContentfulStatusCode import, add
  explicit types for OpenAPI schema converter, and fix test client typing.

## 0.2.0

### Minor Changes

- Initial release of @timdehof/honoforge - consolidated package with subpath
  exports for core, openapi, and middleware.
