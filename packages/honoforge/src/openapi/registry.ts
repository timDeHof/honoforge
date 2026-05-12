import type { OpenAPIHono } from "@hono/zod-openapi";

/**
 * Normalized route extracted from the OpenAPIHono registry.
 * This is the single interface between honoforge and @hono/zod-openapi's
 * internal registry structure.
 */
export interface RegistryRoute {
  method: string;
  path: string;
  summary?: string;
  description?: string;
  tags?: string[];
  operationId?: string;
  request?: Record<string, unknown>;
  responses?: Record<string, unknown>;
}

/** Internal duck type for the OpenAPIHono registry structure. */
interface OpenAPIHonoLike {
  openAPIRegistry?: {
    _definitions?: Array<{ type: string; route?: RegistryRoute }>;
  };
}

/**
 * Extract all registered routes from an OpenAPIHono instance.
 *
 * This is the single point of knowledge about @hono/zod-openapi's
 * internal registry structure. If the upstream format changes,
 * only this module adapts.
 *
 * @param app - The OpenAPIHono instance
 * @returns Array of normalized route configs
 */
export function getRegistryRoutes(app: OpenAPIHono): RegistryRoute[] {
  const registry = (app as unknown as OpenAPIHonoLike).openAPIRegistry;
  if (!registry) {
    return [];
  }

  const definitions = registry._definitions || [];
  return definitions
    .filter(d => d.type === "route" && d.route)
    .map(d => d.route!);
}
