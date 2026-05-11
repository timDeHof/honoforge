import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  createResponse,
  errorResponse,
  extendZodWithOpenAPI,
  extractRouteMetadata,
  generateOpenAPIDoc,
  generateOpenAPIDocYAML,
  getRouteByPath,
  listRoutes,
  okResponse,
  serveOpenAPIDoc,
  zodToOpenAPI,
} from "../../src/openapi/index.js";

describe("cross-runtime", () => {
  it("imports and executes zodToOpenAPI without throwing", () => {
    const result = zodToOpenAPI(z.string());
    expect(result).toEqual({ type: "string" });
  });

  it("imports and executes okResponse without throwing", () => {
    const result = okResponse({ test: true });
    expect(result).toMatchObject({ status: 200, data: { test: true } });
  });

  it("imports and executes createResponse without throwing", () => {
    const result = createResponse("hello", 200);
    expect(result).toMatchObject({ status: 200, data: "hello" });
  });

  it("imports and executes errorResponse without throwing", () => {
    const result = errorResponse(400, { message: "bad" });
    expect(result).toMatchObject({ status: 400, data: { message: "bad" } });
  });

  it("imports listRoutes as a function", () => {
    expect(typeof listRoutes).toBe("function");
  });

  it("imports extractRouteMetadata as a function", () => {
    expect(typeof extractRouteMetadata).toBe("function");
  });

  it("imports getRouteByPath as a function", () => {
    expect(typeof getRouteByPath).toBe("function");
  });

  it("imports generateOpenAPIDoc as a function", () => {
    expect(typeof generateOpenAPIDoc).toBe("function");
  });

  it("imports serveOpenAPIDoc as a function", () => {
    expect(typeof serveOpenAPIDoc).toBe("function");
  });

  it("imports generateOpenAPIDocYAML as a function", () => {
    expect(typeof generateOpenAPIDocYAML).toBe("function");
  });

  it("imports extendZodWithOpenAPI as a function", () => {
    expect(typeof extendZodWithOpenAPI).toBe("function");
  });
});
