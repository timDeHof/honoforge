import type { OpenAPIHono } from "@hono/zod-openapi";

import type { RegistryRoute } from "./registry.js";

import { getRegistryRoutes } from "./registry.js";

export interface RouteMetadata {
  method: string;
  path: string;
  summary?: string;
  description?: string;
  tags?: string[];
  requestSchema?: Record<string, unknown>;
  responseSchemas?: Record<number, Record<string, unknown>>;
}

function toRouteMetadata(route: RegistryRoute): RouteMetadata {
  const metadata: RouteMetadata = {
    method: route.method,
    path: route.path,
  };

  if (route.summary) {
    metadata.summary = route.summary;
  }
  if (route.description) {
    metadata.description = route.description;
  }
  if (route.tags) {
    metadata.tags = route.tags;
  }

  // Extract request schema if present
  if (route.request) {
    const requestSchema: Record<string, unknown> = {};
    if (route.request.query) {
      requestSchema.query = route.request.query;
    }
    if (route.request.params) {
      requestSchema.params = route.request.params;
    }
    if (route.request.headers) {
      requestSchema.headers = route.request.headers;
    }
    if (route.request.body) {
      requestSchema.body = route.request.body;
    }
    if (Object.keys(requestSchema).length > 0) {
      metadata.requestSchema = requestSchema;
    }
  }

  // Extract response schemas
  if (route.responses) {
    const responseSchemas: Record<number, Record<string, unknown>> = {};
    for (const [status, response] of Object.entries(route.responses)) {
      responseSchemas[Number(status)] = response as Record<string, unknown>;
    }
    if (Object.keys(responseSchemas).length > 0) {
      metadata.responseSchemas = responseSchemas;
    }
  }

  return metadata;
}

/**
 * Extract full metadata from all routes registered on an OpenAPIHono instance.
 *
 * @param app - The OpenAPIHono instance
 * @returns Array of route metadata objects
 */
export function extractRouteMetadata(app: OpenAPIHono): RouteMetadata[] {
  return getRegistryRoutes(app).map(toRouteMetadata);
}

/**
 * Get a simplified list of routes (method + path only) from an OpenAPIHono instance.
 *
 * @param app - The OpenAPIHono instance
 * @returns Array of { method, path } tuples
 */
export function listRoutes(app: OpenAPIHono): Array<{ method: string; path: string }> {
  const metadata = extractRouteMetadata(app);
  return metadata.map(({ method, path }) => ({ method, path }));
}

/**
 * Get metadata for a specific route by path.
 *
 * @param app - The OpenAPIHono instance
 * @param path - The route path to find
 * @returns Route metadata or undefined if not found
 */
export function getRouteByPath(
  app: OpenAPIHono,
  path: string,
): RouteMetadata | undefined {
  const metadata = extractRouteMetadata(app);
  return metadata.find(route => route.path === path);
}
