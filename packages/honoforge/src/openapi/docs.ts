import type { OpenAPIHono } from "@hono/zod-openapi";
import type { MiddlewareHandler } from "hono";

import { stringify } from "yaml";

interface OpenAPIHonoLike {
  openAPIRegistry?: {
    _definitions?: Array<{ type: string; route?: { path: string; method: string; responses?: Record<string, unknown>; summary?: string; description?: string; tags?: string[]; operationId?: string; request?: Record<string, unknown> } }>;
  };
}

export interface OpenAPIDocConfig {
  title: string;
  version: string;
  description?: string;
}

export interface OpenAPIServeConfig {
  title: string;
  version: string;
  path?: string;
}

export interface OpenAPIObject {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: Record<string, Record<string, unknown>>;
  components?: Record<string, unknown>;
}

/**
 * Generate a complete OpenAPI 3.1 document from an OpenAPIHono instance.
 *
 * @param app - The OpenAPIHono instance
 * @param config - Document metadata (title, version, optional description)
 * @returns OpenAPI 3.1 document object
 */
export function generateOpenAPIDoc(
  app: OpenAPIHono,
  config: OpenAPIDocConfig,
): OpenAPIObject {
  const registry = (app as unknown as OpenAPIHonoLike).openAPIRegistry;
  const definitions = registry?._definitions || [];
  const routes = definitions
    .filter((d: any) => d.type === "route" && d.route)
    .map((d: any) => d.route);

  const paths: Record<string, Record<string, unknown>> = {};

  for (const route of routes) {
    const pathKey = route.path;
    if (!paths[pathKey]) {
      paths[pathKey] = {};
    }

    const operation: Record<string, unknown> = {
      responses: route.responses || {},
    };

    if (route.summary) {
      operation.summary = route.summary;
    }
    if (route.description) {
      operation.description = route.description;
    }
    if (route.tags) {
      operation.tags = route.tags;
    }
    if (route.operationId) {
      operation.operationId = route.operationId;
    }

    // Build request body / parameters
    if (route.request) {
      const req = route.request as Record<string, unknown>;
      const parameters: Array<Record<string, unknown>> = [];

      if (req.params) {
        // Extract path parameters from the route path
        const pathParams = route.path.match(/\{(\w+)\}/g)?.map((p: string) => p.slice(1, -1)) || [];
        for (const param of pathParams) {
          parameters.push({
            name: param,
            in: "path",
            required: true,
            schema: {},
          });
        }
      }

      if (req.query) {
        parameters.push({
          name: "query",
          in: "query",
          schema: {},
        });
      }

      if (req.headers) {
        parameters.push({
          name: "headers",
          in: "header",
          schema: {},
        });
      }

      if (parameters.length > 0) {
        operation.parameters = parameters;
      }

      if (req.body) {
        operation.requestBody = {
          content: {
            "application/json": {
              schema: {},
            },
          },
        };
      }
    }

    paths[pathKey][route.method] = operation;
  }

  const doc: OpenAPIObject = {
    openapi: "3.1.0",
    info: {
      title: config.title,
      version: config.version,
      ...(config.description ? { description: config.description } : {}),
    },
    paths,
  };

  return doc;
}

/**
 * Create a Hono middleware handler that serves the OpenAPI JSON document.
 *
 * @param app - The OpenAPIHono instance
 * @param config - Serve configuration (title, version, optional path)
 * @returns Hono middleware handler
 */
export function serveOpenAPIDoc(
  app: OpenAPIHono,
  config: OpenAPIServeConfig,
): MiddlewareHandler {
  const servePath = config.path || "/openapi";
  const doc = generateOpenAPIDoc(app, {
    title: config.title,
    version: config.version,
  });

  return async (c, next) => {
    if (c.req.path === servePath && c.req.method === "GET") {
      return c.json(doc, 200, {
        "Content-Type": "application/json",
      });
    }
    return next();
  };
}

/**
 * Generate an OpenAPI 3.1 document as a YAML string.
 *
 * @param app - The OpenAPIHono instance
 * @param config - Document metadata (title, version)
 * @returns YAML string representation of the OpenAPI document
 */
export function generateOpenAPIDocYAML(
  app: OpenAPIHono,
  config: OpenAPIDocConfig,
): string {
  const doc = generateOpenAPIDoc(app, config);
  return stringify(doc);
}
