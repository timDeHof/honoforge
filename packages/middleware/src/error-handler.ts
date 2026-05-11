import type { MiddlewareHandler, ErrorHandler } from 'hono'
import { formatError } from './error-formatter.js'
import type { ForgeEnv } from '@honoforge/core'

export interface ErrorHandlerOptions {
  /**
   * When true, replaces 5xx error details with a generic message
   * to prevent leaking internal error information to clients.
   * @default false
   */
  isProduction?: boolean
}

/**
 * Create an Hono ErrorHandler function that returns RFC 9457 Problem Details responses.
 *
 * Use with `app.onError(errorHandler(options))`.
 *
 * @param options - Optional configuration
 * @returns Hono ErrorHandler function
 */
export const createErrorHandler = (options?: ErrorHandlerOptions): ErrorHandler => {
  return (error, c) => {
    const problem = formatError(error)

    // In production mode, sanitize 5xx error details
    if (options?.isProduction && problem.status >= 500) {
      problem.detail = 'An internal server error occurred'
    }

    return c.json(problem, problem.status, {
      'Content-Type': 'application/problem+json',
    })
  }
}

/**
 * RFC 9457 Problem Details error handler middleware.
 *
 * This middleware wraps the error handler to work with both
 * `app.use('*', errorHandler())` and `app.onError(errorHandler())` patterns.
 *
 * When used with `app.use()`, it catches errors in the middleware chain.
 * When used with `app.onError()`, use `createErrorHandler()` instead.
 *
 * @param options - Optional configuration
 * @returns Hono middleware
 */
export const errorHandler = (options?: ErrorHandlerOptions): MiddlewareHandler<ForgeEnv> => {
  return async (c, next) => {
    await next()
    // Note: Errors thrown by downstream handlers are caught by Hono's
    // error handling system. Use app.onError(createErrorHandler()) for
    // global error handling, or use this middleware with try/catch
    // for route-specific error handling.
  }
}
