import { HTTPException } from "hono/http-exception";

import type { ProblemDetails, ProblemDetailsOptions } from "./error-types.js";

// Status code to phrase mapping for Problem Details defaults
const STATUS_PHRASES: Record<number, string> = {
  100: "Continue",
  101: "Switching Protocols",
  200: "OK",
  201: "Created",
  202: "Accepted",
  204: "No Content",
  301: "Moved Permanently",
  302: "Found",
  304: "Not Modified",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  409: "Conflict",
  422: "Unprocessable Entity",
  429: "Too Many Requests",
  500: "Internal Server Error",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
};

/**
 * Universal error formatter that converts various error types to RFC 9457 Problem Details.
 *
 * Handles:
 * - Error instances: uses error.name and error.message
 * - Objects with status property (like Hono's HTTPException): uses error.status
 * - Strings: wraps in a ProblemDetails structure
 * - Unknown types: returns generic 500 error
 *
 * @param error - The error to format
 * @param options - Optional overrides for Problem Details fields
 * @returns RFC 9457 Problem Details object
 */
interface ErrorLike {
  status: number;
  name?: unknown;
  message?: unknown;
}

export function formatError(
  error: unknown,
  options?: Partial<ProblemDetailsOptions>,
): ProblemDetails {
  // Handle HTTPException from Hono
  if (error instanceof HTTPException) {
    return formatHTTPError(error, options);
  }

  // Handle objects with status property
  if (
    typeof error === "object"
    && error !== null
    && "status" in error
    && typeof (error as ErrorLike).status === "number"
  ) {
    const err = error as ErrorLike;
    const status = err.status as number;
    return formatProblemDetails({
      status,
      title: options?.title || String(err.name || "Error"),
      detail: options?.detail || String(err.message || "An error occurred"),
      type: options?.type,
      instance: options?.instance,
      extensions: options?.extensions,
    });
  }

  // Handle Error instances
  if (error instanceof Error) {
    return formatProblemDetails({
      status: options?.status || 500,
      title: options?.title || error.name,
      detail: options?.detail || error.message,
      type: options?.type,
      instance: options?.instance,
      extensions: options?.extensions,
    });
  }

  // Handle strings
  if (typeof error === "string") {
    return formatProblemDetails({
      status: options?.status || 500,
      title: options?.title || "Error",
      detail: options?.detail || error,
      type: options?.type,
      instance: options?.instance,
      extensions: options?.extensions,
    });
  }

  // Handle unknown types
  return formatProblemDetails({
    status: options?.status || 500,
    title: options?.title || "Internal Server Error",
    detail: options?.detail || "An unexpected error occurred",
    type: options?.type,
    instance: options?.instance,
    extensions: options?.extensions,
  });
}

/**
 * Specialized formatter for Hono's HTTPException.
 *
 * @param error - The HTTPException to format
 * @param options - Optional overrides
 * @returns RFC 9457 Problem Details object
 */
export function formatHTTPError(
  error: HTTPException,
  options?: Partial<ProblemDetailsOptions>,
): ProblemDetails {
  return formatProblemDetails({
    status: error.status,
    title: options?.title || error.name,
    detail: options?.detail || error.message,
    type: options?.type,
    instance: options?.instance,
    extensions: options?.extensions,
  });
}

/**
 * Low-level Problem Details builder.
 * Takes ProblemDetailsOptions and returns a complete ProblemDetails object
 * with defaults filled in.
 *
 * @param options - Problem Details configuration
 * @returns Complete ProblemDetails object
 */
export function formatProblemDetails(
  options: ProblemDetailsOptions,
): ProblemDetails {
  const status = options.status;
  const phrase = STATUS_PHRASES[status] || "Unknown";

  const result: ProblemDetails = {
    type: options.type || "about:blank",
    title: options.title || phrase,
    status,
    detail: options.detail || phrase,
  };

  if (options.instance) {
    result.instance = options.instance;
  }

  // Merge extension members
  if (options.extensions) {
    for (const [key, value] of Object.entries(options.extensions)) {
      result[key] = value;
    }
  }

  return result;
}
