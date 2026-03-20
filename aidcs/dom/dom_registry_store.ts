import { ConfigProvider } from "../config/types";
import { DomRegistryEntry } from "../types";

export class DomRegistryStore {
  private provider: ConfigProvider;
  private path: string;

  constructor(provider: ConfigProvider, path: string) {
    this.provider = provider;
    this.path = path;
  }

  async write(entries: DomRegistryEntry[]): Promise<void> {
    const payload = {
      schema_version: "1.0",
      generated_at: new Date().toISOString(),
      entries
    };
    await this.provider.writeJson(this.path, payload);
  }

  async read(): Promise<DomRegistryEntry[] | null> {
    const exists = await this.provider.exists(this.path);
    if (!exists) return null;
    const payload = await this.provider.readJson(this.path);
    if (payload && typeof payload === "object" && "entries" in (payload as Record<string, unknown>)) {
      return (payload as { entries: DomRegistryEntry[] }).entries;
    }
    return null;
  }
}
