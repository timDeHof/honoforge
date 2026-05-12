import { OpenAPIHono } from "@hono/zod-openapi";
import { testClient } from "hono/testing";
import { describe, expect, it } from "vitest";

import { serveOpenAPIDoc } from "../../src/openapi/serve.js";

type TestRouteClient = Record<string, { $get: () => Promise<Response> }>;

describe("serveOpenAPIDoc", () => {
  it("returns a middleware function", () => {
    const app = new OpenAPIHono();
    const middleware = serveOpenAPIDoc(app, {
      title: "Test API",
      version: "1.0.0",
    });
    expect(typeof middleware).toBe("function");
  });

  it("serves OpenAPI document at default path", async () => {
    const app = new OpenAPIHono();
    app.openapi(
      { method: "get", path: "/health", responses: { 200: { description: "OK" } } },
      c => c.json({ status: "ok" }),
    );
    app.use(serveOpenAPIDoc(app, { title: "Test API", version: "1.0.0" }));

    const client = testClient(app) as unknown as TestRouteClient;
    const res = await client.openapi.$get();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.openapi).toBe("3.1.0");
    expect(body.info.title).toBe("Test API");
  });

  it("serves OpenAPI document at custom path", async () => {
    const app = new OpenAPIHono();
    app.openapi(
      { method: "get", path: "/health", responses: { 200: { description: "OK" } } },
      c => c.json({ status: "ok" }),
    );
    app.use(serveOpenAPIDoc(app, { title: "Test API", version: "1.0.0", path: "/api-docs" }));

    const client = testClient(app) as unknown as TestRouteClient;
    const res = await client["api-docs"].$get();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.openapi).toBe("3.1.0");
  });

  it("calls next() for non-matching paths", async () => {
    const app = new OpenAPIHono();
    app.use(serveOpenAPIDoc(app, { title: "Test API", version: "1.0.0" }));
    app.get("/other", c => c.json({ message: "other route" }));

    const client = testClient(app) as unknown as TestRouteClient;
    const res = await client.other.$get();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({ message: "other route" });
  });

  it("sets correct Content-Type header", async () => {
    const app = new OpenAPIHono();
    app.use(serveOpenAPIDoc(app, { title: "Test API", version: "1.0.0" }));

    const client = testClient(app) as unknown as TestRouteClient;
    const res = await client.openapi.$get();
    expect(res.headers.get("content-type")).toContain("application/json");
  });
});
