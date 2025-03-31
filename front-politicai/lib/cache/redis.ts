import Redis from "ioredis";

export abstract class Cache {
    abstract get<T>(key: string): Promise<T | null>;
    abstract set<T>(key: string, value: T, ttl?: number): Promise<void>;
    abstract delete(key: string): Promise<void>;
}

class RedisCache extends Cache {
    private client!: Redis;
    private enabled: boolean;

    constructor() {
        super();
        this.enabled = !!process.env.REDIS_URL;

        if (this.enabled) {
            if (!process.env.REDIS_URL) {
                throw new Error("REDIS_URL is not defined in the environment variables");
            }

            this.client = new Redis(process.env.REDIS_URL);
        }
    }

    async get<T>(key: string): Promise<T | null> {
        if (!this.enabled) return null;
        const data = await this.client.get(key);
        return data ? JSON.parse(data) : null;
    }

    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        if (!this.enabled) return;
        const data = JSON.stringify(value);
        if (ttl) {
            await this.client.set(key, data, "EX", ttl);
        } else {
            await this.client.set(key, data);
        }
    }

    async delete(key: string): Promise<void> {
        if (!this.enabled) return;
        await this.client.del(key);
    }
}

class InMemoryCache extends Cache {
    private store: Map<string, { value: any; expiry: number | null }> = new Map();

    async get<T>(key: string): Promise<T | null> {
        const entry = this.store.get(key);
        if (!entry) {
            return null;
        }

        const now = Date.now();
        if (entry.expiry !== null && now > entry.expiry) {
            this.store.delete(key);
            return null;
        }

        return entry.value as T;
    }

    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        const expiry = ttl ? Date.now() + ttl * 1000 : null;
        this.store.set(key, { value, expiry });
    }

    async delete(key: string): Promise<void> {
        this.store.delete(key);
    }
}

let cacheInstance: Cache | null = null;

export function getCache(): Cache {
    if (!cacheInstance) {
        if (process.env.REDIS_URL) {
            console.log("Using Redis Cache");
            cacheInstance = new RedisCache();
        } else {
            console.log("Using In-Memory Cache");
            cacheInstance = new InMemoryCache();
        }
    }
    return cacheInstance;
}