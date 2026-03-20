import { AgentAction, ActionExecutionResult } from "../types";
import { KernelMemory, MemoryConfig } from "./memory_store";

export interface KernelConfig {
  enabled?: boolean;
  batch_size?: number;
  throttle_ms?: number;
  memory_limit?: number;
  max_batches?: number;
  coalesce_sections?: boolean;
  adaptive_throttle?: {
    min_ms?: number;
    max_ms?: number;
    step_ms?: number;
  };
}

type Executor = (actions: AgentAction[]) => ActionExecutionResult[];

export class AIDCSKernel {
  readonly memory: KernelMemory;
  private batchSize: number;
  private throttleMs: number;
  private adaptive?: { min: number; max: number; step: number };
  private maxBatches?: number;
  private coalesce: boolean;
  private cancelled = false;

  constructor(config: KernelConfig = {}) {
    this.batchSize = config.batch_size ?? 5;
    this.throttleMs = config.throttle_ms ?? 0;
    if (config.adaptive_throttle) {
      this.adaptive = {
        min: config.adaptive_throttle.min_ms ?? this.throttleMs ?? 0,
        max: config.adaptive_throttle.max_ms ?? 50,
        step: config.adaptive_throttle.step_ms ?? 8
      };
      // Seed throttle with min when adaptive is on.
      this.throttleMs = this.adaptive.min;
    }
    this.maxBatches = config.max_batches;
    this.coalesce = Boolean(config.coalesce_sections);
    this.memory = new KernelMemory({ limit: config.memory_limit });
  }

  cancel(): void {
    this.cancelled = true;
  }

  async run(actions: AgentAction[], executor: Executor): Promise<{ results: ActionExecutionResult[]; cancelled: boolean }> {
    this.cancelled = false;
    const queue = this.coalesce ? this.coalesceBySection(actions) : actions;
    const maxBatches = this.maxBatches ?? Math.ceil(queue.length / this.batchSize);

    const results: ActionExecutionResult[] = [];
    let batchCount = 0;

    for (let i = 0; i < queue.length; i += this.batchSize) {
      if (this.cancelled || batchCount >= maxBatches) break;
      const start = performance.now ? performance.now() : Date.now();

      const chunk = queue.slice(i, i + this.batchSize);
      results.push(...executor(chunk));
      batchCount += 1;

      const end = performance.now ? performance.now() : Date.now();
      this.tuneThrottle(end - start);

      if (this.throttleMs > 0 && i + this.batchSize < queue.length) {
        await this.delay(this.throttleMs);
      }
    }

    return { results, cancelled: this.cancelled || batchCount >= maxBatches };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private coalesceBySection(actions: AgentAction[]): AgentAction[] {
    const bySection = new Map<string, AgentAction>();
    for (const action of actions) {
      // keep the highest-confidence action per section
      const existing = bySection.get(action.section);
      if (!existing || action.confidence > existing.confidence) {
        bySection.set(action.section, action);
      }
    }
    return Array.from(bySection.values());
  }

  private tuneThrottle(batchDurationMs: number): void {
    if (!this.adaptive) return;
    if (batchDurationMs > this.throttleMs && this.throttleMs < this.adaptive.max) {
      this.throttleMs = Math.min(this.adaptive.max, this.throttleMs + this.adaptive.step);
    } else if (batchDurationMs < this.throttleMs && this.throttleMs > this.adaptive.min) {
      this.throttleMs = Math.max(this.adaptive.min, this.throttleMs - this.adaptive.step);
    }
  }
}
