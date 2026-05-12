import type { OpenAPIHono } from "@hono/zod-openapi";

import { stringify } from "yaml";

import { getRegistryRoutes } from "./registry.js";

export interface OpenAPIDocConfig {
  title: string;
  version: string;
  description?: string;
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
  const routes = getRegistryRoutes(app);

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
      const parameters: Array<Record<string, unknown>> = [];

      if (route.request.params) {
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

      if (route.request.query) {
        parameters.push({
          name: "query",
          in: "query",
          schema: {},
        });
      }

      if (route.request.headers) {
        parameters.push({
          name: "headers",
          in: "header",
          schema: {},
        });
      }

      if (parameters.length > 0) {
        operation.parameters = parameters;
      }

      if (route.request.body) {
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
