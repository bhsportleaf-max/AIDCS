import { ConfigProvider } from "../../config/types";

async function getFs() {
  const module = await import("fs");
  return module.promises;
}

async function getPath() {
  return await import("path");
}

// Lightweight .env loader (no external dependency). Loads if a .env file exists in cwd.
function loadDotEnv(): void {
  if (typeof process === "undefined") return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require("fs");
    const path = require("path");
    const envPath = path.resolve(process.cwd(), ".env");
    if (!fs.existsSync(envPath)) return;
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  } catch {
    // ignore dotenv load failures
  }
}

loadDotEnv();

export class NodeConfigProvider implements ConfigProvider {
  private async resolve(path: string): Promise<string> {
    const pathModule = await getPath();
    return pathModule.resolve(process.cwd(), path);
  }

  async readJson(path: string): Promise<unknown> {
    const fs = await getFs();
    const fullPath = await this.resolve(path);
    const content = await fs.readFile(fullPath, "utf8");
    return JSON.parse(content);
  }

  async writeJson(path: string, data: unknown): Promise<void> {
    const fs = await getFs();
    const fullPath = await this.resolve(path);
    const json = JSON.stringify(data, null, 2);
    await fs.writeFile(fullPath, json, "utf8");
  }

  async exists(path: string): Promise<boolean> {
    const fs = await getFs();
    const fullPath = await this.resolve(path);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}
