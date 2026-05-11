import type { HttpStatusCode } from "../index.js";

export type StatusCode = typeof HttpStatusCode extends Record<string, infer V>
  ? V extends number
    ? V
    : number
  : number;

export interface ForgeTypedResponse<T> {
  status: number;
  data: T;
  description?: string;
}

/**
 * Generic response builder returning a typed response object.
 *
 * @param data - The response body data
 * @param status - HTTP status code
 * @param description - Optional description of the response
 * @returns Typed response object
 */
export function createResponse<T>(
  data: T,
  status: number,
  description?: string,
): ForgeTypedResponse<T> {
  return { status, data, ...(description ? { description } : {}) };
}

/**
 * Shorthand for 200 OK responses.
 *
 * @param data - The response body data
 * @param description - Optional description
 * @returns Typed 200 response
 */
export function okResponse<T>(
  data: T,
  description?: string,
): ForgeTypedResponse<T> {
  return createResponse(data, 200, description);
}

/**
 * Shorthand for 201 Created responses.
 *
 * @param data - The response body data
 * @param description - Optional description
 * @returns Typed 201 response
 */
export function createdResponse<T>(
  data: T,
  description?: string,
): ForgeTypedResponse<T> {
  return createResponse(data, 201, description);
}

/**
 * Error response builder.
 *
 * @param status - HTTP error status code
 * @param error - Error data object
 * @param description - Optional description
 * @returns Typed error response
 */
export function errorResponse<T>(
  status: number,
  error: T,
  description?: string,
): ForgeTypedResponse<T> {
  return createResponse(error, status, description);
}
