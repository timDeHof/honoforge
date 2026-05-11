import { describe, expect, it } from "vitest";

import * as HttpStatusCode from "../src/http-status-codes.js";
import * as HttpPhrase from "../src/http-status-phrases.js";

describe("hTTP status codes", () => {
  it("oK equals 200", () => {
    expect(HttpStatusCode.OK).toBe(200);
  });
  it("nOT_FOUND equals 404", () => {
    expect(HttpStatusCode.NOT_FOUND).toBe(404);
  });
  it("iNTERNAL_SERVER_ERROR equals 500", () => {
    expect(HttpStatusCode.INTERNAL_SERVER_ERROR).toBe(500);
  });
  it("all exports are numbers", () => {
    for (const [_key, value] of Object.entries(HttpStatusCode)) {
      expect(typeof value).toBe("number");
    }
  });
});

describe("hTTP status phrases", () => {
  it("oK equals OK", () => {
    expect(HttpPhrase.OK).toBe("OK");
  });
  it("nOT_FOUND equals Not Found", () => {
    expect(HttpPhrase.NOT_FOUND).toBe("Not Found");
  });
  it("all exports are strings", () => {
    for (const [_key, value] of Object.entries(HttpPhrase)) {
      expect(typeof value).toBe("string");
    }
  });
});

describe("codes and phrases alignment", () => {
  it("same number of constants", () => {
    expect(Object.keys(HttpStatusCode).length).toBe(Object.keys(HttpPhrase).length);
  });
});
