import type { BootstrapHooks } from "./hooks";
import type { PipelineEngine, PipelineMiddlewareRegistration } from "./pipeline";
import { mergeHooks } from "./hooks";

export interface AIDCSPlugin {
  name: string;
  hooks?: Partial<BootstrapHooks>;
  middleware?: PipelineMiddlewareRegistration[];
  init?: (ctx: PluginInitContext) => void | Promise<void>;
}

export interface PluginInitContext {
  shared: Record<string, unknown>;
}

export class PluginRegistry {
  private plugins: AIDCSPlugin[] = [];

  constructor(plugins: AIDCSPlugin[] = []) {
    plugins.forEach(plugin => this.register(plugin));
  }

  register(plugin: AIDCSPlugin): void {
    this.plugins.push(plugin);
  }

  list(): AIDCSPlugin[] {
    return [...this.plugins];
  }

  async initAll(shared: Record<string, unknown>): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.init) {
        await plugin.init({ shared });
      }
    }
  }

  collectHooks(): BootstrapHooks {
    const hookSets = this.plugins.map(plugin => plugin.hooks).filter(Boolean) as Partial<BootstrapHooks>[];
    return mergeHooks(...hookSets);
  }

  applyToPipeline(pipeline: PipelineEngine): void {
    for (const plugin of this.plugins) {
      if (plugin.middleware && plugin.middleware.length > 0) {
        pipeline.registerMany(plugin.middleware);
      }
    }
  }
}
