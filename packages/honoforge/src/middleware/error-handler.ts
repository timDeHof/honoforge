import type { ErrorHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import { formatError } from "./error-formatter.js";

export interface ErrorHandlerOptions {
  /**
   * When true, replaces 5xx error details with a generic message
   * to prevent leaking internal error information to clients.
   * @default false
   */
  isProduction?: boolean;
}

/**
 * Create an Hono ErrorHandler function that returns RFC 9457 Problem Details responses.
 *
 * Use with `app.onError(createErrorHandler(options))`.
 *
 * @param options - Optional configuration
 * @returns Hono ErrorHandler function
 */
export const createErrorHandler = (options?: ErrorHandlerOptions): ErrorHandler => {
  return (error, c) => {
    const problem = formatError(error);

    // In production mode, sanitize 5xx error details
    if (options?.isProduction && problem.status >= 500) {
      return c.json({ ...problem, detail: "An internal server error occurred" }, problem.status as ContentfulStatusCode, {
        "Content-Type": "application/problem+json",
      });
    }

    return c.json(problem, problem.status as ContentfulStatusCode, {
      "Content-Type": "application/problem+json",
    });
  };
};
