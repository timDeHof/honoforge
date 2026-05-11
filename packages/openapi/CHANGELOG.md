# @honoforge/openapi

## 0.1.0

### Minor Changes

- feat: add OpenAPI utilities and RFC 9457 error handling middleware

  @honoforge/openapi:

  - Zod-to-OpenAPI schema conversion (custom recursive converter, 25+ Zod types)
  - Typed response builders (createResponse, okResponse, createdResponse,
    errorResponse)
  - Route metadata extraction (extractRouteMetadata, listRoutes, getRouteByPath)
  - OpenAPI docs generation (generateOpenAPIDoc, serveOpenAPIDoc,
    generateOpenAPIDocYAML)
  - 34 tests

  @honoforge/middleware:

  - RFC 9457 Problem Details error handler (errorHandler, createErrorHandler)
  - Error formatting utilities (formatError, formatHTTPError,
    formatProblemDetails)
  - Content-Type: application/problem+json responses
  - 24 tests
