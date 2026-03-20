export interface MemoryConfig {
  limit?: number;
}

// Simple size-bounded in-memory store for agent/kernel data.
export class KernelMemory {
  private store = new Map<string, unknown>();
  private limit: number;

  constructor(config: MemoryConfig = {}) {
    this.limit = config.limit ?? 500;
  }

  set(key: string, value: unknown): void {
    if (this.store.size >= this.limit) {
      // Remove oldest entry to preserve bounded memory usage.
      const oldestKey = this.store.keys().next().value as string | undefined;
      if (oldestKey) this.store.delete(oldestKey);
    }
    this.store.set(key, value);
  }

  get<T = unknown>(key: string): T | undefined {
    return this.store.get(key) as T | undefined;
  }

  has(key: string): boolean {
    return this.store.has(key);
  }

  clear(): void {
    this.store.clear();
  }

  keys(): string[] {
    return Array.from(this.store.keys());
  }
}
