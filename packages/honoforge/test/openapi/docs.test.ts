import { OpenAPIHono } from "@hono/zod-openapi";
import { describe, expect, it } from "vitest";

import { generateOpenAPIDoc, generateOpenAPIDocYAML, serveOpenAPIDoc } from "../../src/openapi/docs.js";

describe("generateOpenAPIDoc", () => {
  it("produces valid OpenAPI 3.1 structure", () => {
    const app = new OpenAPIHono();
    const doc = generateOpenAPIDoc(app, {
      title: "Test API",
      version: "1.0.0",
    });
    expect(doc.openapi).toBe("3.1.0");
    expect(doc.info).toMatchObject({
      title: "Test API",
      version: "1.0.0",
    });
    expect(doc.paths).toBeDefined();
  });

  it("includes description when provided", () => {
    const app = new OpenAPIHono();
    const doc = generateOpenAPIDoc(app, {
      title: "Test API",
      version: "1.0.0",
      description: "A test API",
    });
    expect(doc.info.description).toBe("A test API");
  });

  it("includes routes from the app", () => {
    const app = new OpenAPIHono();
    app.openapi(
      { method: "get", path: "/health", responses: { 200: { description: "OK" } } },
      c => c.json({ status: "ok" }),
    );
    const doc = generateOpenAPIDoc(app, {
      title: "Health API",
      version: "1.0.0",
    });
    expect(doc.paths).toHaveProperty("/health");
  });
});

describe("serveOpenAPIDoc", () => {
  it("returns a middleware function", () => {
    const app = new OpenAPIHono();
    const middleware = serveOpenAPIDoc(app, {
      title: "Test API",
      version: "1.0.0",
    });
    expect(typeof middleware).toBe("function");
  });
});

describe("generateOpenAPIDocYAML", () => {
  it("returns a valid YAML string", () => {
    const app = new OpenAPIHono();
    const yaml = generateOpenAPIDocYAML(app, {
      title: "Test API",
      version: "1.0.0",
    });
    expect(typeof yaml).toBe("string");
    expect(yaml).toContain("openapi: 3.1.0");
    expect(yaml).toContain("title: Test API");
  });
});
