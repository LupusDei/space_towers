import { describe, it, expect, beforeEach } from 'vitest';
import {
  StorageService,
  createStorageService,
  createMemoryStorage,
  type StorageBackend,
} from './StorageService';

describe('StorageService', () => {
  let storage: StorageService;
  let backend: StorageBackend;

  beforeEach(() => {
    backend = createMemoryStorage();
    storage = new StorageService(backend);
  });

  describe('get', () => {
    it('should return null for non-existent key', () => {
      expect(storage.get('nonexistent')).toBeNull();
    });

    it('should deserialize JSON values', () => {
      backend.setItem('space_towers_test', JSON.stringify({ foo: 'bar' }));
      expect(storage.get<{ foo: string }>('test')).toEqual({ foo: 'bar' });
    });

    it('should return null for invalid JSON', () => {
      backend.setItem('space_towers_test', 'not valid json{');
      expect(storage.get('test')).toBeNull();
    });

    it('should handle primitive values', () => {
      backend.setItem('space_towers_number', JSON.stringify(42));
      backend.setItem('space_towers_string', JSON.stringify('hello'));
      backend.setItem('space_towers_bool', JSON.stringify(true));

      expect(storage.get<number>('number')).toBe(42);
      expect(storage.get<string>('string')).toBe('hello');
      expect(storage.get<boolean>('bool')).toBe(true);
    });

    it('should handle arrays', () => {
      backend.setItem('space_towers_arr', JSON.stringify([1, 2, 3]));
      expect(storage.get<number[]>('arr')).toEqual([1, 2, 3]);
    });
  });

  describe('set', () => {
    it('should serialize values to JSON', () => {
      storage.set('test', { foo: 'bar' });
      expect(backend.getItem('space_towers_test')).toBe('{"foo":"bar"}');
    });

    it('should handle primitive values', () => {
      storage.set('number', 42);
      storage.set('string', 'hello');
      storage.set('bool', true);

      expect(backend.getItem('space_towers_number')).toBe('42');
      expect(backend.getItem('space_towers_string')).toBe('"hello"');
      expect(backend.getItem('space_towers_bool')).toBe('true');
    });

    it('should handle arrays', () => {
      storage.set('arr', [1, 2, 3]);
      expect(backend.getItem('space_towers_arr')).toBe('[1,2,3]');
    });

    it('should overwrite existing values', () => {
      storage.set('test', 'first');
      storage.set('test', 'second');
      expect(storage.get<string>('test')).toBe('second');
    });
  });

  describe('remove', () => {
    it('should remove existing key', () => {
      storage.set('test', 'value');
      storage.remove('test');
      expect(storage.get('test')).toBeNull();
    });

    it('should not throw for non-existent key', () => {
      expect(() => storage.remove('nonexistent')).not.toThrow();
    });
  });

  describe('has', () => {
    it('should return false for non-existent key', () => {
      expect(storage.has('nonexistent')).toBe(false);
    });

    it('should return true for existing key', () => {
      storage.set('test', 'value');
      expect(storage.has('test')).toBe(true);
    });

    it('should return false after key is removed', () => {
      storage.set('test', 'value');
      storage.remove('test');
      expect(storage.has('test')).toBe(false);
    });
  });

  describe('prefix', () => {
    it('should use default prefix', () => {
      storage.set('key', 'value');
      expect(backend.getItem('space_towers_key')).toBe('"value"');
    });

    it('should use custom prefix', () => {
      const customStorage = new StorageService(backend, 'custom_');
      customStorage.set('key', 'value');
      expect(backend.getItem('custom_key')).toBe('"value"');
    });

    it('should isolate keys with different prefixes', () => {
      const storage1 = new StorageService(backend, 'prefix1_');
      const storage2 = new StorageService(backend, 'prefix2_');

      storage1.set('key', 'value1');
      storage2.set('key', 'value2');

      expect(storage1.get<string>('key')).toBe('value1');
      expect(storage2.get<string>('key')).toBe('value2');
    });
  });
});

describe('createStorageService', () => {
  it('should create a StorageService with memory backend when localStorage unavailable', () => {
    const storage = createStorageService(createMemoryStorage());
    expect(storage).toBeInstanceOf(StorageService);
  });

  it('should accept custom prefix', () => {
    const backend = createMemoryStorage();
    const storage = createStorageService(backend, 'test_');
    storage.set('key', 'value');
    expect(backend.getItem('test_key')).toBe('"value"');
  });
});

describe('createMemoryStorage', () => {
  it('should create a functional storage backend', () => {
    const backend = createMemoryStorage();

    expect(backend.getItem('key')).toBeNull();

    backend.setItem('key', 'value');
    expect(backend.getItem('key')).toBe('value');

    backend.removeItem('key');
    expect(backend.getItem('key')).toBeNull();
  });

  it('should isolate different instances', () => {
    const backend1 = createMemoryStorage();
    const backend2 = createMemoryStorage();

    backend1.setItem('key', 'value1');
    backend2.setItem('key', 'value2');

    expect(backend1.getItem('key')).toBe('value1');
    expect(backend2.getItem('key')).toBe('value2');
  });
});
