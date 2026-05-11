import type { OpenAPIHono, RouteConfig } from "@hono/zod-openapi";

export interface RouteMetadata {
  method: string;
  path: string;
  summary?: string;
  description?: string;
  tags?: string[];
  requestSchema?: Record<string, unknown>;
  responseSchemas?: Record<number, Record<string, unknown>>;
}

interface RegistryDefinition {
  type: string;
  route?: RouteConfig;
}

interface OpenAPIHonoLike {
  openAPIRegistry?: {
    _definitions?: Array<{ type: string; route?: RouteConfig }>;
  };
}

/**
 * Extract full metadata from all routes registered on an OpenAPIHono instance.
 *
 * @param app - The OpenAPIHono instance
 * @returns Array of route metadata objects
 */
export function extractRouteMetadata(app: OpenAPIHono): RouteMetadata[] {
  const registry = (app as unknown as OpenAPIHonoLike).openAPIRegistry;
  if (!registry) {
    return [];
  }

  const definitions: RegistryDefinition[] = registry._definitions || [];
  const routes = definitions
    .filter(d => d.type === "route" && d.route)
    .map(d => d.route!);

  return routes.map((route) => {
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
      const req = route.request as Record<string, unknown>;
      const requestSchema: Record<string, unknown> = {};
      if (req.query) {
        requestSchema.query = req.query;
      }
      if (req.params) {
        requestSchema.params = req.params;
      }
      if (req.headers) {
        requestSchema.headers = req.headers;
      }
      if (req.body) {
        requestSchema.body = req.body;
      }
      if (Object.keys(requestSchema).length > 0) {
        metadata.requestSchema = requestSchema;
      }
    }

    // Extract response schemas
    if (route.responses) {
      const responseSchemas: Record<number, Record<string, unknown>> = {};
      for (const [status, response] of Object.entries(route.responses)) {
        const resp = response as unknown as Record<string, unknown>;
        responseSchemas[Number(status)] = resp as Record<string, unknown>;
      }
      if (Object.keys(responseSchemas).length > 0) {
        metadata.responseSchemas = responseSchemas;
      }
    }

    return metadata;
  });
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
