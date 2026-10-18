import { createClient, RedisClientType } from "redis";

// In-memory fallback for local development when Upstash credentials are not set
// Mirrors the key operations used in the Redis Lua scripts
class InMemoryStore {
  private store: Map<string, { value: string; expiry: number }> = new Map();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, expiryMs: number): Promise<void> {
    this.store.set(key, { value, expiry: Date.now() + expiryMs });
  }

  async incr(key: string, increment: number): Promise<number> {
    const entry = this.store.get(key);
    let current = 0;
    if (entry) {
      current = parseInt(entry.value, 10);
    }
    const newValue = current + increment;
    this.store.set(key, { value: String(newValue), expiry: entry ? entry.expiry : Date.now() + 86400000 });
    return newValue;
  }

  async expire(key: string, seconds: number): Promise<void> {
    const entry = this.store.get(key);
    if (entry) {
      entry.expiry = Date.now() + seconds * 1000;
    }
  }

  async setnx(key: string, value: string, expiryMs: number): Promise<boolean> {
    if (this.store.has(key)) return false;
    this.store.set(key, { value, expiry: Date.now() + expiryMs });
    return true;
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }
}

// Global in-memory store instance (singleton per process)
export const memoryStore = new InMemoryStore();

// Type union for seamless switching
export type RedisClient = RedisClientType | typeof memoryStore;

// Create Upstash Redis client or return memory fallback
export function createRedisClient(
  url?: string,
  token?: string
): RedisClient {
  if (url) {
    try {
      const client = createClient({
        url: url,
        password: token || undefined,
      });
      client.on("error", (err) => {
        console.error("Upstash Redis error, falling back to in-memory:", err.message);
      });
      void client.connect();
      return client as RedisClient;
    } catch (err) {
      console.error("Failed to create Upstash client, using in-memory fallback:", err);
    }
  }
  console.log("🔄 No Upstash Redis credentials provided — using in-memory Lua emulator");
  return memoryStore;
}

// Helper to check if we're using upstash or memory
export function isUsingUpstash(client: RedisClient): boolean {
  return (client as RedisClientType)?.isOpen ?? false;
}

export default createRedisClient;