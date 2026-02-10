import NodeCache from 'node-cache';

const cache = new NodeCache({ checkperiod: 120 });

export const TTL = {
  TERMS: 86400,      // 24 hours
  SEARCH: 900,       // 15 minutes
  SECTIONS: 300,     // 5 minutes
} as const;

export function cacheGet<T>(key: string): T | undefined {
  return cache.get<T>(key);
}

export function cacheSet<T>(key: string, value: T, ttl: number): void {
  cache.set(key, value, ttl);
}

export function cacheFlush(): void {
  cache.flushAll();
}
