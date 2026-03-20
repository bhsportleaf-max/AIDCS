import type { RuntimeConfig } from "../config/types";
import { ErrorCenter } from "../errors/error_center";
import type { DomScanner } from "../dom/dom_scanner";
import type { IntentRouter } from "../intent/intent_router";
import type { SupervisorAgent } from "../agents/supervisor_agent";
import type { ActionEngine } from "../actions/action_engine";

type IndexConfig = Awaited<ReturnType<typeof import("../config/config_loader").loadIndexConfig>>;
type RuntimeConfigFile = Awaited<ReturnType<typeof import("../config/config_loader").loadRuntimeConfig>>;
type BuiltContext = ReturnType<typeof import("../context/context_builder").buildContext>;

export interface BootstrapHooks {
  onConfigLoaded?: (payload: {
    indexConfig: IndexConfig;
    runtimeConfig: RuntimeConfigFile;
    envConfig: Record<string, unknown> | null;
    mergedRuntime: RuntimeConfig;
  }) => void | Promise<void>;
  onDomScanned?: (payload: {
    scanResult: ReturnType<DomScanner["scan"]>;
  }) => void | Promise<void>;
  onRegistryWritten?: (payload: {
    registryPath: string;
    registry: ReturnType<DomScanner["scan"]>["registry"];
  }) => void | Promise<void>;
  onContextBuilt?: (payload: { context: BuiltContext }) => void | Promise<void>;
  onIntentResolved?: (payload: {
    input: string;
    resolvedIntent: ReturnType<IntentRouter["route"]>;
  }) => void | Promise<void>;
  onActionsPlanned?: (payload: {
    actions: ReturnType<SupervisorAgent["coordinate"]>;
  }) => void | Promise<void>;
  onActionsExecuted?: (payload: {
    results: ReturnType<ActionEngine["execute"]>;
  }) => void | Promise<void>;
  onError?: (payload: { stage: string; error: Error }) => void | Promise<void>;
}

const hookKeys = [
  "onConfigLoaded",
  "onDomScanned",
  "onRegistryWritten",
  "onContextBuilt",
  "onIntentResolved",
  "onActionsPlanned",
  "onActionsExecuted",
  "onError"
] as const;

type HookKey = typeof hookKeys[number];

export function mergeHooks(...sources: Array<Partial<BootstrapHooks> | undefined>): BootstrapHooks {
  const result: Record<string, (payload: unknown) => void | Promise<void>> = {};

  for (const key of hookKeys) {
    const fns = sources
      .map(source => source?.[key])
      .filter(Boolean) as Array<(payload: unknown) => void | Promise<void>>;
    if (fns.length === 0) continue;
    result[key] = async (payload: unknown) => {
      for (const fn of fns) {
        await fn(payload);
      }
    };
  }

  return result as BootstrapHooks;
}

export async function runHook<T>(
  hook: ((payload: T) => void | Promise<void>) | undefined,
  payload: T,
  stage: string,
  logger?: { warn: (message: string, data?: unknown) => void }
): Promise<void> {
  if (!hook) return;
  try {
    await hook(payload);
  } catch (error) {
    const err = error as Error;
    if (logger) {
      logger.warn(`Hook error at ${stage}`, err.message);
    } else if (typeof console !== "undefined") {
      console.warn(`[AIDCS] Hook error at ${stage}`, err.message);
    }
    ErrorCenter.report(stage, err, "Inspect hook implementation; ensure it does not throw.");
  }
}
