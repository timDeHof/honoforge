import { HTTPException } from "hono/http-exception";
import { describe, expect, it } from "vitest";

import { formatError, formatHTTPError, formatProblemDetails } from "../../src/middleware/error-formatter.js";

describe("formatError", () => {
  it("formats a plain Error instance", () => {
    const result = formatError(new Error("test error"));
    expect(result).toMatchObject({
      type: "about:blank",
      title: "Error",
      detail: "test error",
      status: 500,
    });
  });

  it("formats an object with status property", () => {
    const result = formatError({ status: 400, message: "Bad input", name: "BadRequest" });
    expect(result).toMatchObject({
      status: 400,
      title: "BadRequest",
      detail: "Bad input",
    });
  });

  it("formats a string error", () => {
    const result = formatError("string error");
    expect(result).toMatchObject({
      title: "Error",
      detail: "string error",
      status: 500,
    });
  });

  it("formats unknown types as 500", () => {
    const result = formatError(null);
    expect(result).toMatchObject({
      title: "Internal Server Error",
      status: 500,
    });
  });

  it("merges extensions into result", () => {
    const result = formatError(new Error("test"), {
      extensions: { traceId: "abc-123", requestId: "req-456" },
    });
    expect(result.traceId).toBe("abc-123");
    expect(result.requestId).toBe("req-456");
  });

  it("respects options overrides", () => {
    const result = formatError(new Error("test"), {
      type: "https://example.com/errors/test",
      title: "Custom Title",
      status: 422,
    });
    expect(result).toMatchObject({
      type: "https://example.com/errors/test",
      title: "Custom Title",
      status: 422,
      detail: "test",
    });
  });
});

describe("formatHTTPError", () => {
  it("formats HTTPException with correct status", () => {
    const error = new HTTPException(404, { message: "Not found" });
    const result = formatHTTPError(error);
    expect(result).toMatchObject({
      status: 404,
      detail: "Not found",
    });
  });

  it("uses options overrides", () => {
    const error = new HTTPException(500, { message: "Server error" });
    const result = formatHTTPError(error, {
      type: "https://example.com/errors/server",
      extensions: { code: "INTERNAL_ERROR" },
    });
    expect(result.type).toBe("https://example.com/errors/server");
    expect(result.code).toBe("INTERNAL_ERROR");
  });
});

describe("formatProblemDetails", () => {
  it("returns complete ProblemDetails with defaults", () => {
    const result = formatProblemDetails({ status: 400, detail: "Bad input" });
    expect(result).toMatchObject({
      type: "about:blank",
      title: "Bad Request",
      status: 400,
      detail: "Bad input",
    });
  });

  it("uses custom type and title", () => {
    const result = formatProblemDetails({
      status: 403,
      type: "https://example.com/forbidden",
      title: "Access Denied",
      detail: "You do not have permission",
    });
    expect(result).toMatchObject({
      type: "https://example.com/forbidden",
      title: "Access Denied",
      status: 403,
      detail: "You do not have permission",
    });
  });

  it("includes instance when provided", () => {
    const result = formatProblemDetails({
      status: 500,
      instance: "/api/users/123",
    });
    expect(result.instance).toBe("/api/users/123");
  });
});
