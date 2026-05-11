import type { MiddlewareHandler } from "hono";

import { describe, expectTypeOf, it } from "vitest";

import type { ExtendContext, ForgeBindings, ForgeEnv, ForgeMiddlewareHandler, ForgeVariables } from "../src/types.js";

describe("forgeEnv", () => {
  it("has Variables and Bindings as Record types", () => {
    expectTypeOf<ForgeEnv["Variables"]>().toMatchTypeOf<Record<string, unknown>>();
    expectTypeOf<ForgeEnv["Bindings"]>().toMatchTypeOf<Record<string, unknown>>();
  });
  it("is a type, not an interface (verified by intersection)", () => {
    type Extended = ForgeEnv & { Variables: { user: string } };
    expectTypeOf<Extended["Variables"]>().toMatchTypeOf<{ user: string }>();
  });
});

describe("forgeMiddlewareHandler", () => {
  it("is assignable to Hono MiddlewareHandler", () => {
    expectTypeOf<ForgeMiddlewareHandler>().toMatchTypeOf<MiddlewareHandler>();
  });
});

describe("extendContext", () => {
  it("merges variables correctly", () => {
    type Base = ForgeEnv;
    type WithUser = ExtendContext<Base, { user: { id: string } }>;
    expectTypeOf<WithUser["Variables"]["user"]>().toMatchTypeOf<{ id: string }>();
  });
});

describe("forgeVariables", () => {
  it("extracts Variables from ForgeEnv", () => {
    expectTypeOf<ForgeVariables>().toMatchTypeOf<Record<string, unknown>>();
  });
  it("extracts Variables from extended Env", () => {
    type Extended = ForgeEnv & { Variables: { user: string } };
    expectTypeOf<ForgeVariables<Extended>>().toMatchTypeOf<{ user: string }>();
  });
});

describe("forgeBindings", () => {
  it("extracts Bindings from ForgeEnv", () => {
    expectTypeOf<ForgeBindings>().toMatchTypeOf<Record<string, unknown>>();
  });
  it("extracts Bindings from extended Env", () => {
    type Extended = ForgeEnv & { Bindings: { DB: object } };
    expectTypeOf<ForgeBindings<Extended>>().toMatchTypeOf<{ DB: object }>();
  });
});
