import { describe, it, expect } from 'vitest'
import {
  createResponse,
  okResponse,
  createdResponse,
  errorResponse,
} from '../src/response.js'

describe('createResponse', () => {
  it('returns a typed response with custom status', () => {
    const result = createResponse({ id: 1 }, 200)
    expect(result).toEqual({
      status: 200,
      data: { id: 1 },
    })
  })

  it('includes description when provided', () => {
    const result = createResponse('hello', 200, 'A greeting')
    expect(result).toEqual({
      status: 200,
      data: 'hello',
      description: 'A greeting',
    })
  })
})

describe('okResponse', () => {
  it('returns 200 status with data', () => {
    const result = okResponse({ id: 1, name: 'test' })
    expect(result).toEqual({
      status: 200,
      data: { id: 1, name: 'test' },
    })
  })

  it('includes description when provided', () => {
    const result = okResponse({ message: 'success' }, 'Operation succeeded')
    expect(result.description).toBe('Operation succeeded')
  })
})

describe('createdResponse', () => {
  it('returns 201 status with data', () => {
    const result = createdResponse({ id: 1 })
    expect(result).toEqual({
      status: 201,
      data: { id: 1 },
    })
  })
})

describe('errorResponse', () => {
  it('returns error response with status and error data', () => {
    const result = errorResponse(400, { message: 'Bad request' })
    expect(result).toEqual({
      status: 400,
      data: { message: 'Bad request' },
    })
  })

  it('includes description when provided', () => {
    const result = errorResponse(500, { error: 'Internal error' }, 'Server error')
    expect(result.description).toBe('Server error')
  })
})
