import { OpenAPIHono } from "@hono/zod-openapi";
import { describe, expect, it } from "vitest";

import { extractRouteMetadata, getRouteByPath, listRoutes } from "../../src/openapi/routes.js";

describe("listRoutes", () => {
  it("returns empty array for app with no routes", () => {
    const app = new OpenAPIHono();
    const routes = listRoutes(app);
    expect(routes).toEqual([]);
  });

  it("returns method and path for registered routes", () => {
    const app = new OpenAPIHono();
    app.openapi(
      {
        method: "get",
        path: "/users",
        responses: { 200: { description: "Get users" } },
      },
      c => c.json([]),
    );
    const routes = listRoutes(app);
    expect(routes).toHaveLength(1);
    expect(routes[0]).toMatchObject({ method: "get", path: "/users" });
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
    const routes = listRoutes(app);
    expect(routes).toHaveLength(2);
  });
});

describe("extractRouteMetadata", () => {
  it("extracts metadata from a route", () => {
    const app = new OpenAPIHono();
    app.openapi(
      {
        method: "get",
        path: "/users/{id}",
        summary: "Get user by ID",
        description: "Returns a single user",
        tags: ["Users"],
        responses: { 200: { description: "OK" } },
      },
      c => c.json({ id: 1 }),
    );
    const metadata = extractRouteMetadata(app);
    expect(metadata).toHaveLength(1);
    expect(metadata[0]).toMatchObject({
      method: "get",
      path: "/users/{id}",
      summary: "Get user by ID",
      description: "Returns a single user",
      tags: ["Users"],
    });
  });
});

describe("getRouteByPath", () => {
  it("returns undefined for non-existent path", () => {
    const app = new OpenAPIHono();
    const route = getRouteByPath(app, "/nonexistent");
    expect(route).toBeUndefined();
  });

  it("finds route by path", () => {
    const app = new OpenAPIHono();
    app.openapi(
      { method: "get", path: "/users", responses: { 200: { description: "OK" } } },
      c => c.json([]),
    );
    const route = getRouteByPath(app, "/users");
    expect(route).toBeDefined();
    expect(route?.method).toBe("get");
    expect(route?.path).toBe("/users");
  });
});
