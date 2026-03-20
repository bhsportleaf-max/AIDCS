import { ConfigProvider } from "../../config/types";

export class BrowserConfigProvider implements ConfigProvider {
  async readJson(path: string): Promise<unknown> {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load ${path}: ${response.status}`);
    }
    return await response.json();
  }

  async writeJson(path: string, data: unknown): Promise<void> {
    const key = `aidcs:${path}`;
    localStorage.setItem(key, JSON.stringify(data));
  }

  async exists(path: string): Promise<boolean> {
    try {
      const response = await fetch(path, { method: "HEAD" });
      return response.ok;
    } catch {
      return false;
    }
  }
}
