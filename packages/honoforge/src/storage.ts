/**
 * ForgeStorage — unified storage adapter interface for honoforge middleware.
 * Implement this interface for rate limiting, caching, idempotency, and sessions.
 *
 * @typeParam T - The type of values stored (default: unknown)
 * @example
 * // In-memory implementation
 * class MemoryStorage implements ForgeStorage {
 *   private store = new Map<string, { value: unknown; expiry?: number }>()
 *   async get<T>(key: string): Promise<T | null> { ... }
 *   async set(key: string, value: unknown, ttl?: number): Promise<void> { ... }
 *   async delete(key: string): Promise<boolean> { ... }
 *   async ttl(key: string): Promise<number | null> { ... }
 * }
 */
export interface ForgeStorage<T = unknown> {
  /**
   * Retrieve a value by key.
   * @param key - Storage key
   * @returns The stored value, or null if not found
   */
  get: <TValue = T>(key: string) => Promise<TValue | null>;

  /**
   * Store a value with optional TTL (time-to-live in milliseconds).
   * @param key - Storage key
   * @param value - Value to store
   * @param ttl - Optional time-to-live in milliseconds
   */
  set: (key: string, value: T, ttl?: number) => Promise<void>;

  /**
   * Delete a value by key.
   * @param key - Storage key
   * @returns true if the key existed and was deleted, false otherwise
   */
  delete: (key: string) => Promise<boolean>;

  /**
   * Get remaining TTL for a key in milliseconds.
   * @param key - Storage key
   * @returns Remaining TTL in ms, or null if key doesn't exist or has no TTL
   */
  ttl: (key: string) => Promise<number | null>;
}
