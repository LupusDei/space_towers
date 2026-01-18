// StorageService - Local storage abstraction with JSON serialization
// Handles get/set/remove operations for persistent game data

// ============================================================================
// Types
// ============================================================================

export interface StorageBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

// ============================================================================
// StorageService Class
// ============================================================================

export class StorageService {
  private backend: StorageBackend;
  private prefix: string;

  constructor(backend: StorageBackend, prefix = 'space_towers_') {
    this.backend = backend;
    this.prefix = prefix;
  }

  /**
   * Get a value from storage, deserializing from JSON.
   * @param key - The key to retrieve
   * @returns The parsed value, or null if not found or invalid JSON
   */
  get<T>(key: string): T | null {
    const prefixedKey = this.prefix + key;
    const raw = this.backend.getItem(prefixedKey);
    if (raw === null) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  /**
   * Set a value in storage, serializing to JSON.
   * @param key - The key to store
   * @param value - The value to store (will be JSON serialized)
   */
  set<T>(key: string, value: T): void {
    const prefixedKey = this.prefix + key;
    const serialized = JSON.stringify(value);
    this.backend.setItem(prefixedKey, serialized);
  }

  /**
   * Remove a value from storage.
   * @param key - The key to remove
   */
  remove(key: string): void {
    const prefixedKey = this.prefix + key;
    this.backend.removeItem(prefixedKey);
  }

  /**
   * Check if a key exists in storage.
   * @param key - The key to check
   * @returns True if the key exists
   */
  has(key: string): boolean {
    const prefixedKey = this.prefix + key;
    return this.backend.getItem(prefixedKey) !== null;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createStorageService(
  backend: StorageBackend = typeof localStorage !== 'undefined' ? localStorage : createMemoryStorage(),
  prefix?: string
): StorageService {
  return new StorageService(backend, prefix);
}

// ============================================================================
// Memory Storage (for testing/SSR)
// ============================================================================

export function createMemoryStorage(): StorageBackend {
  const store = new Map<string, string>();
  return {
    getItem(key: string): string | null {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string): void {
      store.set(key, value);
    },
    removeItem(key: string): void {
      store.delete(key);
    },
  };
}
