import type { Env, MiddlewareHandler } from 'hono'

/**
 * ForgeEnv — shared Env interface for honoforge middleware.
 * Use `type` (not `interface`) — required by Hono v4 type system.
 * Extends with your own Variables and Bindings via intersection.
 *
 * @example
 * type AppEnv = ForgeEnv & {
 *   Variables: { user: User; requestId: string }
 *   Bindings: { DB: D1Database }
 * }
 */
export type ForgeEnv = {
  Variables: Record<string, unknown>
  Bindings: Record<string, unknown>
}

/**
 * ForgeMiddlewareHandler — typed middleware handler for honoforge.
 * Always use this (or createMiddleware wrapping it) to preserve
 * type inference in the middleware chain.
 *
 * @example
 * const authMiddleware: ForgeMiddlewareHandler<AppEnv> = async (c, next) => {
 *   const user = await authenticate(c.req.header('Authorization'))
 *   c.set('user', user)
 *   await next()
 * }
 */
export type ForgeMiddlewareHandler<
  E extends ForgeEnv = ForgeEnv,
  P extends string = string,
> = MiddlewareHandler<E, P>

/**
 * Extend the Hono context with additional variables in a type-safe way.
 * Use this helper when you need to augment an existing context's Variables.
 *
 * @example
 * type WithUser = ExtendContext<ForgeEnv, { user: User }>
 */
export type ExtendContext<
  E extends ForgeEnv,
  V extends Record<string, unknown>,
> = Omit<E, 'Variables'> & {
  Variables: E['Variables'] & V
}

/**
 * Extract the Variables type from a ForgeEnv.
 * Useful for type-level operations on context variables.
 */
export type ForgeVariables<E extends ForgeEnv = ForgeEnv> = E['Variables']

/**
 * Extract the Bindings type from a ForgeEnv.
 * Useful for type-level operations on runtime bindings.
 */
export type ForgeBindings<E extends ForgeEnv = ForgeEnv> = E['Bindings']
