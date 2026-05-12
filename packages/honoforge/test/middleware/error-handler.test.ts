import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { testClient } from "hono/testing";
import { describe, expect, it } from "vitest";

import { createErrorHandler } from "../../src/middleware/error-handler.js";

type TestRouteClient = Record<string, { $get: () => Promise<Response> }>;

describe("createErrorHandler", () => {
  it("catches a thrown Error and returns problem+json response", async () => {
    const app = new Hono();
    app.onError(createErrorHandler());
    app.get("/error", () => {
      throw new Error("Something went wrong");
    });

    const client = testClient(app) as unknown as TestRouteClient;
    const res = await client.error.$get();
    expect(res.status).toBe(500);
    expect(res.headers.get("content-type")).toContain("application/problem+json");

    const body = await res.json();
    expect(body).toMatchObject({
      type: "about:blank",
      title: "Error",
      status: 500,
      detail: "Something went wrong",
    });
  });

  it("catches HTTPException and returns correct status code", async () => {
    const app = new Hono();
    app.onError(createErrorHandler());
    app.get("/not-found", () => {
      throw new HTTPException(404, { message: "Resource not found" });
    });

    const client = testClient(app) as unknown as TestRouteClient;
    const res = await client["not-found"].$get();
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.status).toBe(404);
    expect(body.detail).toBe("Resource not found");
  });

  it("passes through successful requests", async () => {
    const app = new Hono();
    app.onError(createErrorHandler());
    app.get("/ok", c => c.json({ message: "success" }));

    const client = testClient(app) as unknown as TestRouteClient;
    const res = await client.ok.$get();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({ message: "success" });
  });

  it("sets Content-Type to application/problem+json", async () => {
    const app = new Hono();
    app.onError(createErrorHandler());
    app.get("/fail", () => {
      throw new Error("fail");
    });

    const client = testClient(app) as unknown as TestRouteClient;
    const res = await client.fail.$get();
    const contentType = res.headers.get("content-type");
    expect(contentType).toContain("application/problem+json");
  });

  it("returns valid ProblemDetails with all required fields", async () => {
    const app = new Hono();
    app.onError(createErrorHandler());
    app.get("/fail", () => {
      throw new Error("test error");
    });

    const client = testClient(app) as unknown as TestRouteClient;
    const res = await client.fail.$get();
    const body = await res.json();

    expect(body).toHaveProperty("type");
    expect(body).toHaveProperty("title");
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("detail");
  });

  it("sanitizes 5xx details in production mode", async () => {
    const app = new Hono();
    app.onError(createErrorHandler({ isProduction: true }));
    app.get("/fail", () => {
      throw new Error("Sensitive internal details: SQL query failed");
    });

    const client = testClient(app) as unknown as TestRouteClient;
    const res = await client.fail.$get();
    const body = await res.json();

    expect(body.detail).toBe("An internal server error occurred");
    expect(body.status).toBe(500);
  });
});
