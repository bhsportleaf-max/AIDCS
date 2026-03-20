import { ConfigProvider } from "../../config/types";

export class MemoryConfigProvider implements ConfigProvider {
  private store: Record<string, unknown>;

  constructor(initial: Record<string, unknown> = {}) {
    this.store = { ...initial };
  }

  async readJson(path: string): Promise<unknown> {
    if (!(path in this.store)) {
      throw new Error(`Missing in-memory config: ${path}`);
    }
    return this.store[path];
  }

  async writeJson(path: string, data: unknown): Promise<void> {
    this.store[path] = data;
  }

  async exists(path: string): Promise<boolean> {
    return path in this.store;
  }
}
