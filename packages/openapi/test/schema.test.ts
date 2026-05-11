import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { zodToOpenAPI, extendZodWithOpenAPI } from '../src/schema.js'

// extendZodWithOpenAPI is called at module load time in schema.ts,
// but we re-export it for consumers who need it in their own code.

describe('zodToOpenAPI', () => {
  it('converts z.string() to OpenAPI string schema', () => {
    const result = zodToOpenAPI(z.string())
    expect(result).toEqual({ type: 'string' })
  })

  it('converts z.object() to OpenAPI object schema', () => {
    const schema = z.object({
      id: z.string(),
      name: z.string(),
    })
    const result = zodToOpenAPI(schema, { name: 'User' })
    expect(result).toMatchObject({
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
      },
    })
  })

  it('converts z.array() to OpenAPI array schema', () => {
    const result = zodToOpenAPI(z.array(z.number()))
    expect(result).toEqual({
      type: 'array',
      items: { type: 'number' },
    })
  })

  it('marks optional fields as not required', () => {
    const schema = z.object({
      name: z.string(),
      email: z.string().optional(),
    })
    const result = zodToOpenAPI(schema, { name: 'UserWithEmail' })
    expect(result).toMatchObject({
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
      },
    })
    // Optional fields should not be in the required array
    if (result.required) {
      expect((result as any).required).not.toContain('email')
    }
  })

  it('includes description when provided in options', () => {
    const result = zodToOpenAPI(z.string(), { description: 'A user name' })
    expect(result).toMatchObject({
      type: 'string',
      description: 'A user name',
    })
  })
})
