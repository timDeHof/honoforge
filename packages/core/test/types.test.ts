import { describe, it, expectTypeOf } from 'vitest'
import type { ForgeEnv, ForgeMiddlewareHandler, ExtendContext, ForgeVariables, ForgeBindings } from '../src/types.js'
import type { MiddlewareHandler } from 'hono'

describe('ForgeEnv', () => {
  it('has Variables and Bindings as Record types', () => {
    expectTypeOf<ForgeEnv['Variables']>().toMatchTypeOf<Record<string, unknown>>()
    expectTypeOf<ForgeEnv['Bindings']>().toMatchTypeOf<Record<string, unknown>>()
  })
  it('is a type, not an interface (verified by intersection)', () => {
    type Extended = ForgeEnv & { Variables: { user: string } }
    expectTypeOf<Extended['Variables']>().toMatchTypeOf<{ user: string }>()
  })
})

describe('ForgeMiddlewareHandler', () => {
  it('is assignable to Hono MiddlewareHandler', () => {
    expectTypeOf<ForgeMiddlewareHandler>().toMatchTypeOf<MiddlewareHandler>()
  })
})

describe('ExtendContext', () => {
  it('merges variables correctly', () => {
    type Base = ForgeEnv
    type WithUser = ExtendContext<Base, { user: { id: string } }>
    expectTypeOf<WithUser['Variables']['user']>().toMatchTypeOf<{ id: string }>()
  })
})

describe('ForgeVariables', () => {
  it('extracts Variables from ForgeEnv', () => {
    expectTypeOf<ForgeVariables>().toMatchTypeOf<Record<string, unknown>>()
  })
  it('extracts Variables from extended Env', () => {
    type Extended = ForgeEnv & { Variables: { user: string } }
    expectTypeOf<ForgeVariables<Extended>>().toMatchTypeOf<{ user: string }>()
  })
})

describe('ForgeBindings', () => {
  it('extracts Bindings from ForgeEnv', () => {
    expectTypeOf<ForgeBindings>().toMatchTypeOf<Record<string, unknown>>()
  })
  it('extracts Bindings from extended Env', () => {
    type Extended = ForgeEnv & { Bindings: { DB: object } }
    expectTypeOf<ForgeBindings<Extended>>().toMatchTypeOf<{ DB: object }>()
  })
})
