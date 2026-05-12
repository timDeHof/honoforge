import { OpenAPIHono } from "@hono/zod-openapi";
import { describe, expect, it } from "vitest";

import { getRegistryRoutes } from "../../src/openapi/registry.js";

describe("getRegistryRoutes", () => {
  it("returns empty array for app with no registry", () => {
    const app = new OpenAPIHono();
    const routes = getRegistryRoutes(app);
    expect(routes).toEqual([]);
  });

  it("returns empty array for app with no routes", () => {
    const app = new OpenAPIHono();
    const routes = getRegistryRoutes(app);
    expect(routes).toHaveLength(0);
  });

  it("returns routes registered on the app", () => {
    const app = new OpenAPIHono();
    app.openapi(
      {
        method: "get",
        path: "/users",
        summary: "Get users",
        description: "Returns all users",
        tags: ["Users"],
        responses: { 200: { description: "OK" } },
      },
      c => c.json([]),
    );

    const routes = getRegistryRoutes(app);
    expect(routes).toHaveLength(1);
    expect(routes[0]).toMatchObject({
      method: "get",
      path: "/users",
      summary: "Get users",
      description: "Returns all users",
      tags: ["Users"],
    });
    expect(routes[0].responses).toBeDefined();
  });

  it("returns multiple routes", () => {
    const app = new OpenAPIHono();
    app.openapi(
      { method: "get", path: "/users", responses: { 200: { description: "OK" } } },
      c => c.json([]),
    );
    app.openapi(
      { method: "post", path: "/users", responses: { 201: { description: "Created" } } },
      c => c.json({ id: 1 }),
    );

    const routes = getRegistryRoutes(app);
    expect(routes).toHaveLength(2);
    expect(routes[0].method).toBe("get");
    expect(routes[1].method).toBe("post");
  });

  it("includes request schema when present", () => {
    const app = new OpenAPIHono();
    app.openapi(
      {
        method: "post",
        path: "/users",
        request: { body: { content: { "application/json": { schema: {} } } } },
        responses: { 201: { description: "Created" } },
      },
      c => c.json({ id: 1 }),
    );

    const routes = getRegistryRoutes(app);
    expect(routes[0].request).toBeDefined();
    expect(routes[0].request?.body).toBeDefined();
  });

  it("includes operationId when present", () => {
    const app = new OpenAPIHono();
    app.openapi(
      {
        method: "get",
        path: "/users/{id}",
        operationId: "getUserById",
        responses: { 200: { description: "OK" } },
      },
      c => c.json({ id: 1 }),
    );

    const routes = getRegistryRoutes(app);
    expect(routes[0].operationId).toBe("getUserById");
  });
});
