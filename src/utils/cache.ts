// Enhanced caching utilities for better performance

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
  tags: string[];
  accessCount: number;
  lastAccessed: number;
}

// Cache configuration
interface CacheConfig {
  maxSize: number;
  defaultTTL: number; // Time to live in milliseconds
  cleanupInterval: number;
  compression: boolean;
}

// Advanced cache implementation
export class AdvancedCache<T = any> {
  protected cache = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;
  private hitCount = 0;
  private missCount = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 1000,
      defaultTTL: 300000, // 5 minutes
      cleanupInterval: 60000, // 1 minute
      compression: false,
      ...config
    };

    this.startCleanup();
  }

  // Set cache entry
  set(
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      tags?: string[];
    } = {}
  ): void {
    const { ttl = this.config.defaultTTL, tags = [] } = options;
    const now = Date.now();

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data: this.config.compression ? this.compress(data) : data,
      timestamp: now,
      expiry: now + ttl,
      tags,
      accessCount: 0,
      lastAccessed: now
    };

    this.cache.set(key, entry);
  }

  // Get cache entry
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.missCount++;
      return null;
    }

    const now = Date.now();

    // Check if expired
    if (now > entry.expiry) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    this.hitCount++;

    return this.config.compression ? this.decompress(entry.data) : entry.data;
  }

  // Check if key exists and is valid
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Delete specific key
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Clear cache by tags
  clearByTags(tags: string[]): number {
    let cleared = 0;
    
    this.cache.forEach((entry, key) => {
      if (entry.tags.some(tag => tags.includes(tag))) {
        this.cache.delete(key);
        cleared++;
      }
    });

    return cleared;
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  // Get cache statistics
  getStats() {
    const totalRequests = this.hitCount + this.missCount;
    
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  // Refresh TTL for existing entry
  refresh(key: string, ttl?: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    entry.expiry = Date.now() + (ttl || this.config.defaultTTL);
    return true;
  }

  // Get all keys with optional tag filter
  keys(tag?: string): string[] {
    const keys: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (!tag || entry.tags.includes(tag)) {
        keys.push(key);
      }
    });

    return keys;
  }

  // Preload data with promise
  async preload<R>(
    key: string,
    loader: () => Promise<R>,
    options: { ttl?: number; tags?: string[] } = {}
  ): Promise<R> {
    // Check if already cached
    const cached = this.get(key) as R;
    if (cached !== null) {
      return cached;
    }

    // Load and cache
    const data = await loader();
    this.set(key, data as unknown as T, options);
    return data;
  }

  // Batch operations
  setMany(entries: Array<{ key: string; data: T; options?: { ttl?: number; tags?: string[] } }>): void {
    entries.forEach(({ key, data, options }) => {
      this.set(key, data, options);
    });
  }

  getMany(keys: string[]): Array<{ key: string; data: T | null }> {
    return keys.map(key => ({ key, data: this.get(key) }));
  }

  deleteMany(keys: string[]): number {
    let deleted = 0;
    keys.forEach(key => {
      if (this.delete(key)) deleted++;
    });
    return deleted;
  }

  // Private methods
  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    this.cache.forEach((entry, key) => {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now > entry.expiry) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));

    if (process.env.NODE_ENV === 'development') {
      console.log(`🧹 Cache cleanup: removed ${keysToDelete.length} expired entries`);
    }
  }

  private compress(data: T): T {
    // Simple compression placeholder - in real app, use a compression library
    if (typeof data === 'string') {
      return data as T; // Could implement actual compression here
    }
    return data;
  }

  private decompress(data: T): T {
    // Simple decompression placeholder
    return data;
  }

  private estimateMemoryUsage(): string {
    let size = 0;
    
    this.cache.forEach((entry, key) => {
      size += key.length * 2; // String characters are 2 bytes
      size += JSON.stringify(entry).length * 2; // Rough estimate
    });

    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }

  // Cleanup on destruction
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }
}

// Global cache instances
export const globalCache = new AdvancedCache({
  maxSize: 1000,
  defaultTTL: 300000, // 5 minutes
  cleanupInterval: 60000 // 1 minute
});

export const apiCache = new AdvancedCache({
  maxSize: 500,
  defaultTTL: 180000, // 3 minutes
  cleanupInterval: 30000 // 30 seconds
});

export const imageCache = new AdvancedCache({
  maxSize: 200,
  defaultTTL: 600000, // 10 minutes
  cleanupInterval: 120000 // 2 minutes
});

// Cache decorators for functions
export const withCache = <T extends (...args: any[]) => any>(
  fn: T,
  options: {
    cache?: AdvancedCache;
    keyGenerator?: (...args: Parameters<T>) => string;
    ttl?: number;
    tags?: string[];
  } = {}
): T => {
  const {
    cache = globalCache,
    keyGenerator = (...args) => JSON.stringify(args),
    ttl,
    tags
  } = options;

  return ((...args: Parameters<T>) => {
    const key = `fn:${fn.name}:${keyGenerator(...args)}`;
    
    // Try to get from cache
    const cached = cache.get(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = fn(...args);
    
    // Handle promises
    if (result instanceof Promise) {
      return result.then(value => {
        cache.set(key, value, { ttl, tags });
        return value;
      });
    }

    cache.set(key, result, { ttl, tags });
    return result;
  }) as T;
};

// React hook for cache management
export const useCache = <T>(
  key: string,
  loader: () => Promise<T> | T,
  options: {
    cache?: AdvancedCache;
    ttl?: number;
    tags?: string[];
    enabled?: boolean;
  } = {}
) => {
  const {
    cache = globalCache,
    ttl,
    tags,
    enabled = true
  } = options;

  const load = async (): Promise<T> => {
    if (!enabled) {
      return await loader();
    }

    return cache.preload(key, async () => {
      const result = await loader();
      return result;
    }, { ttl, tags });
  };

  const invalidate = () => {
    cache.delete(key);
  };

  const refresh = () => {
    cache.delete(key);
    return load();
  };

  return {
    load,
    invalidate,
    refresh,
    cached: cache.get(key),
    exists: cache.has(key)
  };
};

// Storage adapters for persistence
export interface StorageAdapter {
  get(key: string): Promise<any> | any;
  set(key: string, value: any): Promise<void> | void;
  delete(key: string): Promise<void> | void;
  clear(): Promise<void> | void;
}

export class LocalStorageAdapter implements StorageAdapter {
  private prefix: string;

  constructor(prefix = 'cache:') {
    this.prefix = prefix;
  }

  get(key: string) {
    try {
      const item = localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  set(key: string, value: any) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  delete(key: string) {
    localStorage.removeItem(this.prefix + key);
  }

  clear() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}

// Persistent cache that uses storage
export class PersistentCache<T = any> extends AdvancedCache<T> {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter, config?: Partial<CacheConfig>) {
    super(config);
    this.storage = storage;
    this.loadFromStorage();
  }

  set(key: string, data: T, options: { ttl?: number; tags?: string[] } = {}): void {
    super.set(key, data, options);
    this.saveToStorage(key);
  }

  delete(key: string): boolean {
    const result = super.delete(key);
    this.storage.delete(key);
    return result;
  }

  clear(): void {
    super.clear();
    this.storage.clear();
  }

  private loadFromStorage(): void {
    // Implementation would load cache from storage on initialization
  }

  private saveToStorage(key: string): void {
    // Implementation would save specific key to storage
    const entry = this.cache.get(key);
    if (entry) {
      this.storage.set(key, entry);
    }
  }
}