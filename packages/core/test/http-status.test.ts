import { describe, it, expect } from 'vitest'
import * as HttpStatusCode from '../src/http-status-codes.js'
import * as HttpPhrase from '../src/http-status-phrases.js'

describe('HTTP status codes', () => {
  it('OK equals 200', () => {
    expect(HttpStatusCode.OK).toBe(200)
  })
  it('NOT_FOUND equals 404', () => {
    expect(HttpStatusCode.NOT_FOUND).toBe(404)
  })
  it('INTERNAL_SERVER_ERROR equals 500', () => {
    expect(HttpStatusCode.INTERNAL_SERVER_ERROR).toBe(500)
  })
  it('all exports are numbers', () => {
    for (const [key, value] of Object.entries(HttpStatusCode)) {
      expect(typeof value).toBe('number')
    }
  })
})

describe('HTTP status phrases', () => {
  it('OK equals "OK"', () => {
    expect(HttpPhrase.OK).toBe('OK')
  })
  it('NOT_FOUND equals "Not Found"', () => {
    expect(HttpPhrase.NOT_FOUND).toBe('Not Found')
  })
  it('all exports are strings', () => {
    for (const [key, value] of Object.entries(HttpPhrase)) {
      expect(typeof value).toBe('string')
    }
  })
})

describe('codes and phrases alignment', () => {
  it('same number of constants', () => {
    expect(Object.keys(HttpStatusCode).length).toBe(Object.keys(HttpPhrase).length)
  })
})
