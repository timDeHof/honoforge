import type { OpenAPIHono } from "@hono/zod-openapi";
import type { MiddlewareHandler } from "hono";

import { generateOpenAPIDoc } from "./docs.js";

export interface OpenAPIServeConfig {
  title: string;
  version: string;
  path?: string;
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
