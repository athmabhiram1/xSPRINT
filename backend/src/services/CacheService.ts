import NodeCache from 'node-cache';

/**
 * In-Memory Cache Service
 * Used for caching leaderboards and analytics
 */

class CacheService {
    private cache: NodeCache;

    constructor() {
        // TTL: 10 seconds, check period: 15 seconds
        this.cache = new NodeCache({
            stdTTL: 10,
            checkperiod: 15,
            useClones: false,
        });
    }

    /**
     * Get value from cache
     */
    get<T>(key: string): T | undefined {
        return this.cache.get<T>(key);
    }

    /**
     * Set value in cache
     */
    set<T>(key: string, value: T, ttl?: number): boolean {
        return this.cache.set(key, value, ttl || 10);
    }

    /**
     * Delete key from cache
     */
    del(key: string): number {
        return this.cache.del(key);
    }

    /**
     * Delete all keys matching pattern
     */
    delPattern(pattern: string): number {
        const keys = this.cache.keys().filter((key) => key.includes(pattern));
        return this.cache.del(keys);
    }

    /**
     * Clear all cache
     */
    flush(): void {
        this.cache.flushAll();
    }

    /**
     * Get cache stats
     */
    getStats() {
        return this.cache.getStats();
    }
}

// Export singleton instance
export const cacheService = new CacheService();
