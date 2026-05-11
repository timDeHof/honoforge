import { describe, it, expect, beforeEach } from 'vitest'
import type { ForgeStorage } from '../src/storage.js'

// In-memory implementation for testing the interface contract
class MemoryStorage implements ForgeStorage {
  private store = new Map<string, { value: unknown; expiry?: number }>()

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key)
    if (!entry) return null
    if (entry.expiry && Date.now() > entry.expiry) {
      this.store.delete(key)
      return null
    }
    return entry.value as T
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiry: ttl ? Date.now() + ttl : undefined,
    })
  }

  async delete(key: string): Promise<boolean> {
    return this.store.delete(key)
  }

  async ttl(key: string): Promise<number | null> {
    const entry = this.store.get(key)
    if (!entry) return null
    if (!entry.expiry) return null
    const remaining = entry.expiry - Date.now()
    return remaining > 0 ? remaining : null
  }
}

describe('ForgeStorage interface (via MemoryStorage)', () => {
  let storage: ForgeStorage

  beforeEach(() => {
    storage = new MemoryStorage()
  })

  it('get returns null for missing key', async () => {
    expect(await storage.get('missing')).toBeNull()
  })

  it('set stores and get retrieves the same value', async () => {
    await storage.set('key', 'value')
    expect(await storage.get('key')).toBe('value')
  })

  it('delete removes a key and returns true', async () => {
    await storage.set('key', 'value')
    expect(await storage.delete('key')).toBe(true)
    expect(await storage.get('key')).toBeNull()
  })

  it('delete on missing key returns false', async () => {
    expect(await storage.delete('missing')).toBe(false)
  })

  it('ttl returns remaining time', async () => {
    await storage.set('key', 'value', 5000)
    const remaining = await storage.ttl('key')
    expect(remaining).toBeGreaterThan(4000)
    expect(remaining).toBeLessThanOrEqual(5000)
  })

  it('ttl returns null for key without TTL', async () => {
    await storage.set('key', 'value')
    expect(await storage.ttl('key')).toBeNull()
  })

  it('ttl returns null for missing key', async () => {
    expect(await storage.ttl('missing')).toBeNull()
  })
})
