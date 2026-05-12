import { describe, expect, it } from "vitest";

import type { ProblemDetails, ProblemDetailsOptions } from "../../src/middleware/index.js";

import {
  createErrorHandler,
  formatError,
  formatHTTPError,
  formatProblemDetails,
} from "../../src/middleware/index.js";

describe("cross-runtime", () => {
  it("imports and executes formatError without throwing", () => {
    const result = formatError(new Error("test"));
    expect(result).toMatchObject({
      type: "about:blank",
      title: "Error",
      status: 500,
    });
  });

  it("imports and executes formatProblemDetails without throwing", () => {
    const result = formatProblemDetails({ status: 200, title: "OK" });
    expect(result).toMatchObject({
      type: "about:blank",
      title: "OK",
      status: 200,
    });
  });

  it("imports createErrorHandler as a function", () => {
    expect(typeof createErrorHandler).toBe("function");
  });

  it("imports formatHTTPError as a function", () => {
    expect(typeof formatHTTPError).toBe("function");
  });

  it("imports ProblemDetails type (compile-time check)", () => {
    // This is a compile-time type check — if it compiles, the type is available
    const _pd: ProblemDetails = {
      type: "about:blank",
      title: "Test",
      status: 200,
      detail: "OK",
    };
    expect(_pd).toBeDefined();
  });

  it("imports ProblemDetailsOptions type (compile-time check)", () => {
    const _opts: ProblemDetailsOptions = {
      status: 200,
      title: "Test",
    };
    expect(_opts).toBeDefined();
  });
});
