import { LlmProvider, LlmRequest, LlmResponse } from "./types";

type Strategy = "priority" | "round_robin";

interface ProviderEntry {
  provider: LlmProvider;
  priority: number;
  healthy: boolean;
  lastError?: string;
  lastChecked?: number;
}

interface GatewayOptions {
  strategy?: Strategy;
  maxRetries?: number;
  healthcheckTTLms?: number;
}

export class LlmGatewayEngine {
  private providers: ProviderEntry[];
  private strategy: Strategy;
  private maxRetries: number;
  private healthcheckTTLms: number;
  private rrIndex = 0;

  constructor(providers: LlmProvider[] = [], options: GatewayOptions = {}) {
    this.providers = providers.map((p, idx) => ({
      provider: p,
      priority: idx,
      healthy: true
    }));
    this.strategy = options.strategy || "priority";
    this.maxRetries = options.maxRetries ?? 3;
    this.healthcheckTTLms = options.healthcheckTTLms ?? 30_000;
  }

  register(provider: LlmProvider, priority = 100): void {
    this.providers.push({ provider, priority, healthy: true });
  }

  async send(request: LlmRequest): Promise<LlmResponse> {
    if (this.providers.length === 0) {
      throw new Error("No LLM providers configured");
    }

    const pool = await this.selectProviders();
    const errors: string[] = [];

    for (const entry of pool.slice(0, this.maxRetries)) {
      try {
        return await entry.provider.send(request);
      } catch (error) {
        entry.healthy = false;
        entry.lastError = (error as Error).message;
        errors.push(`${entry.provider.name}: ${(error as Error).message}`);
      }
    }

    throw new Error(`All LLM providers failed: ${errors.join(" | ")}`);
  }

  private async selectProviders(): Promise<ProviderEntry[]> {
    // Refresh health if needed.
    const now = Date.now();
    for (const entry of this.providers) {
      const shouldCheck =
        entry.provider.healthCheck &&
        (!entry.lastChecked || now - entry.lastChecked > this.healthcheckTTLms);

      if (shouldCheck) {
        try {
          entry.healthy = await entry.provider.healthCheck!();
        } catch {
          entry.healthy = false;
        }
        entry.lastChecked = now;
      }
    }

    const healthy = this.providers.filter(p => p.healthy);
    const fallbackPool = healthy.length > 0 ? healthy : this.providers;

    if (this.strategy === "round_robin") {
      this.rrIndex = (this.rrIndex + 1) % fallbackPool.length;
      const start = this.rrIndex;
      return [...fallbackPool.slice(start), ...fallbackPool.slice(0, start)];
    }

    // priority strategy (lowest number first)
    return [...fallbackPool].sort((a, b) => a.priority - b.priority);
  }
}
