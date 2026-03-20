import {
  loadIndexConfig,
  loadRuntimeConfig,
  loadEnvironmentConfig,
  loadAgentsConfig,
  loadActionRegistry,
  loadIntentMap,
  loadSupervisorConfig,
  mergeConfigs,
  assertValidIndexConfig,
  ConfigProvider,
  RuntimeConfig
} from "../config";
import { DomScanner } from "../dom/dom_scanner";
import { DomRegistryStore } from "../dom/dom_registry_store";
import { buildContext } from "../context/context_builder";
import { IntentRouter } from "../intent/intent_router";
import { buildAgentRegistry } from "../agents/agent_registry";
import { SupervisorAgent } from "../agents/supervisor_agent";
import { ActionEngine } from "../actions/action_engine";
import { OverlayManager } from "../ui/overlay_manager";
import { RegistryVisualizer } from "../ui/registry_visualizer";
import { ExplorerOverlay } from "../ui/explorer_overlay";
import { ErrorPanel } from "../ui/error_panel";
import { BrowserConfigProvider } from "./providers/browser_provider";
import { createLogger } from "./logger";
import { AIDCSRuntime } from "./runtime";
import { BootstrapHooks, mergeHooks, runHook } from "./hooks";
import { PipelineEngine } from "./pipeline";
import { PluginRegistry, AIDCSPlugin } from "./plugins";
import { AIDCSKernel } from "../kernel/runtime_kernel";
import { VoiceController } from "../voice/voice_controller";
import { ErrorCenter } from "../errors/error_center";

export interface BootstrapOptions {
  root?: HTMLElement;
  env?: string;
  provider?: ConfigProvider;
  user_input?: string;
  hooks?: BootstrapHooks;
  plugins?: AIDCSPlugin[];
  pipeline?: PipelineEngine;
}

async function resolveProvider(explicit?: ConfigProvider): Promise<ConfigProvider> {
  if (explicit) return explicit;
  if (typeof window !== "undefined" && typeof fetch !== "undefined") {
    return new BrowserConfigProvider();
  }
  const module = await import("./providers/node_provider");
  return new module.NodeConfigProvider();
}

function resolveEnv(explicit?: string): string {
  if (explicit) return explicit;
  if (typeof process !== "undefined" && process.env && process.env.NODE_ENV) {
    return process.env.NODE_ENV;
  }
  return "development";
}

function mergeRuntimeConfig(base?: RuntimeConfig | null, env?: Record<string, unknown> | null): RuntimeConfig {
  if (base && env) {
    return mergeConfigs(base, env as RuntimeConfig);
  }
  return (base || (env as RuntimeConfig) || {}) as RuntimeConfig;
}

export async function bootstrapAIDCS(options: BootstrapOptions = {}): Promise<AIDCSRuntime> {
  const provider = await resolveProvider(options.provider);
  const env = resolveEnv(options.env);
  const logger = createLogger(env === "production" ? "warn" : "debug", true);
  const pipeline = options.pipeline ?? new PipelineEngine();
  const pluginRegistry = new PluginRegistry(options.plugins || []);
  pluginRegistry.applyToPipeline(pipeline);
  await pluginRegistry.initAll(pipeline.shared);
  const hooks = mergeHooks(pluginRegistry.collectHooks(), options.hooks);

  let indexConfig = await loadIndexConfig(provider);
  assertValidIndexConfig(indexConfig);

  let runtimeConfig = await loadRuntimeConfig(provider);
  let envConfig = await loadEnvironmentConfig(provider, env);
  let mergedRuntime = mergeRuntimeConfig(runtimeConfig, envConfig);

  const configCtx = await pipeline.run(
    "config_loaded",
    { indexConfig, runtimeConfig, envConfig, mergedRuntime },
    undefined,
    logger
  );

  await runHook(
    hooks?.onConfigLoaded,
    configCtx.payload,
    "onConfigLoaded",
    logger
  );

  indexConfig = configCtx.payload.indexConfig;
  runtimeConfig = configCtx.payload.runtimeConfig;
  envConfig = configCtx.payload.envConfig;
  mergedRuntime = configCtx.payload.mergedRuntime;

  let overlay: OverlayManager | null = null;

  const guardConfig = mergedRuntime.performance_guard || {};
  const errorThreshold = guardConfig.error_threshold ?? 5;
  const disableActionsOnTrip = guardConfig.disable_actions_on_trip !== false;
  const disableOverlayOnTrip = guardConfig.disable_overlay_on_trip ?? true;
  let guardTripped = false;

  const maybeTripGuard = () => {
    if (guardTripped) return;
    if (ErrorCenter.count() >= errorThreshold) {
      guardTripped = true;
      logger.warn("AIDCS performance guard tripped; disabling heavy features");
      if (disableOverlayOnTrip && mergedRuntime.development_overlay?.enabled && overlay) {
        overlay.disable();
      }
    }
  };

  const agentsConfig = await loadAgentsConfig(provider);
  const actionRegistry = await loadActionRegistry(provider);
  const intentMap = await loadIntentMap(provider);
  const supervisorConfig = await loadSupervisorConfig(provider);

  const root = options.root || (typeof document !== "undefined" ? document.body : undefined);
  if (!root) {
    throw new Error("No root element available for DOM scanning");
  }

  const architecture = {
    ...indexConfig.aidcs_architecture,
    scan_dom_depth: mergedRuntime.dom_scanner?.scan_depth || indexConfig.aidcs_architecture.scan_dom_depth
  };

  const scanner = new DomScanner(architecture);
  let scanResult = scanner.scan(root);

  const scanCtx = await pipeline.run(
    "dom_scanned",
    { scanResult },
    undefined,
    logger
  );

  await runHook(
    hooks?.onDomScanned,
    scanCtx.payload,
    "onDomScanned",
    logger
  );

  scanResult = scanCtx.payload.scanResult;

  const registryPath = mergedRuntime.dom_registry?.generate_file || indexConfig.dom_registry?.registry_file || "registry/.ai-dom-map.json";
  const registryStore = new DomRegistryStore(provider, registryPath);
  if (mergedRuntime.dom_registry?.auto_generate !== false && indexConfig.dom_registry?.auto_generate !== false) {
    await registryStore.write(scanResult.registry);
  }

  const registryCtx = await pipeline.run(
    "registry_written",
    { registryPath, registry: scanResult.registry },
    undefined,
    logger
  );

  await runHook(
    hooks?.onRegistryWritten,
    registryCtx.payload,
    "onRegistryWritten",
    logger
  );

  scanResult = { ...scanResult, registry: registryCtx.payload.registry };

  let context = buildContext(scanResult.registry, scanResult.tree);

  const contextCtx = await pipeline.run(
    "context_built",
    { context },
    undefined,
    logger
  );

  await runHook(
    hooks?.onContextBuilt,
    contextCtx.payload,
    "onContextBuilt",
    logger
  );

  context = contextCtx.payload.context;

  let explorer: ExplorerOverlay | null = null;
  let errorPanel: ErrorPanel | null = null;

  if (mergedRuntime.development_overlay?.enabled) {
    overlay = new OverlayManager(
      mergedRuntime.development_overlay?.toggle_key || "ALT+A",
      mergedRuntime.development_overlay?.inspector_key || "ALT+S"
    );
    overlay.init();
    overlay.enable();

    const registryVisualizer = new RegistryVisualizer();
      registryVisualizer.attach(scanResult.registry);

    explorer = new ExplorerOverlay(mergedRuntime.development_overlay?.explorer_key || "ALT+E");
    errorPanel = new ErrorPanel("ALT+D");
    errorPanel.attach();
  }

  await pipeline.run(
    "developer_tools",
    {
      overlay_enabled: Boolean(mergedRuntime.development_overlay?.enabled),
      registry_size: scanResult.registry.length
    },
    undefined,
    logger
  );

  const intentRouter = new IntentRouter(intentMap.intent_mappings);
  const agents = buildAgentRegistry(agentsConfig);
  const supervisor = new SupervisorAgent(agentsConfig, supervisorConfig);
  const actionEngine = new ActionEngine(actionRegistry, indexConfig.safety_rules?.allowed_ai_actions || []);

  if (explorer) {
    explorer.attach({
      registry: scanResult.registry,
      agents,
      architecture: indexConfig.aidcs_architecture,
      getTrace: () => pipeline.getTrace()
    });
  }

  const kernelConfig = mergedRuntime.kernel;
  const kernelEnabled = Boolean(kernelConfig?.enabled);
  const kernel = kernelEnabled ? new AIDCSKernel(kernelConfig) : null;
  if (kernel) {
    pipeline.shared.kernel_memory = kernel.memory;
  }

  let voiceController: VoiceController | null = null;

  const handleUserInput = async (input: string) => {
    if (guardTripped && disableActionsOnTrip) {
      logger.warn("AIDCS guard active; skipping user input to protect page performance");
      return [];
    }

    let resolvedIntent = intentRouter.route(input);

    // Early permission enforcement: intent target must match agent + allowed section + action definition.
    const intentViolations: string[] = [];
    const targetAgent = agents.find(a => a.name === resolvedIntent.agent);
    if (!targetAgent) {
      intentViolations.push(`Unknown agent "${resolvedIntent.agent}" for intent "${resolvedIntent.intent}"`);
    } else if (!targetAgent.allowed_sections.includes(resolvedIntent.section)) {
      intentViolations.push(`Agent "${resolvedIntent.agent}" cannot access section "${resolvedIntent.section}"`);
    }
    const actionDef = actionRegistry.actions.find(a => a.name === resolvedIntent.action);
    if (actionDef && !actionDef.allowed_sections.includes(resolvedIntent.section)) {
      intentViolations.push(`Action "${resolvedIntent.action}" not allowed on section "${resolvedIntent.section}"`);
    }

    let intentCtx;
    try {
      intentCtx = await pipeline.run(
        "intent_resolved",
        { input, resolvedIntent, violations: intentViolations },
        undefined,
        logger
      );
    } catch (err) {
      ErrorCenter.report("intent_resolved", err as Error, "Check intent middleware and mappings.");
      maybeTripGuard();
      throw err;
    }

    await runHook(
      hooks?.onIntentResolved,
      intentCtx.payload,
      "onIntentResolved",
      logger
    );

    if (intentViolations.length > 0) {
      logger.warn("Intent blocked by permissions", intentViolations);
      return [];
    }

    resolvedIntent = intentCtx.payload.resolvedIntent;
    const agentContext = {
      intent: resolvedIntent,
      page: context,
      user_input: input
    };
    let plannedActions = supervisor.coordinate(agents, agentContext);

    const planViolations: string[] = [];
    plannedActions = plannedActions.filter(action => {
      const def = actionRegistry.actions.find(a => a.name === action.name);
      if (def && !def.allowed_sections.includes(action.section)) {
        planViolations.push(`Filtered action ${action.name} on ${action.section} (not allowed)`);
        return false;
      }
      return true;
    });

    let plannedCtx;
    try {
      plannedCtx = await pipeline.run(
        "actions_planned",
        { actions: plannedActions, violations: planViolations },
        undefined,
        logger
      );
    } catch (err) {
      ErrorCenter.report("actions_planned", err as Error, "Inspect agent planning middleware.");
      maybeTripGuard();
      throw err;
    }

    await runHook(
      hooks?.onActionsPlanned,
      plannedCtx.payload,
      "onActionsPlanned",
      logger
    );

    plannedActions = plannedCtx.payload.actions;

    let results: ReturnType<ActionEngine["execute"]> = [];
    if (kernel) {
      const kernelResult = await kernel.run(plannedActions, batch => actionEngine.execute(batch, root));
      results = kernelResult.results;
      if (kernelResult.cancelled) {
        logger.warn("Kernel cancelled execution to protect performance");
      }
    } else {
      results = actionEngine.execute(plannedActions, root);
    }

    let executedCtx;
    try {
      executedCtx = await pipeline.run(
        "actions_executed",
        { results },
        undefined,
        logger
      );
    } catch (err) {
      ErrorCenter.report("actions_executed", err as Error, "Check action middleware and DOM permissions.");
      maybeTripGuard();
      throw err;
    }

    await runHook(
      hooks?.onActionsExecuted,
      executedCtx.payload,
      "onActionsExecuted",
      logger
    );

    results = executedCtx.payload.results;

    if (explorer) {
      explorer.refresh();
    }

    logger.debug("Intent resolved", resolvedIntent);
    logger.debug("Actions executed", results);

    return results;
  };

  // Optional voice capture -> intent pipeline
  if (mergedRuntime.voice?.enabled) {
    voiceController = new VoiceController(
      {
        enabled: true,
        auto_start: mergedRuntime.voice?.auto_start,
        sample_ms: mergedRuntime.voice?.sample_ms,
        stt_endpoint: mergedRuntime.voice?.stt_endpoint,
        language: mergedRuntime.voice?.language
      },
      {
        onTranscript: async text => {
          if (text && text.trim()) {
            await handleUserInput(text);
          }
        }
      }
    );
    if (mergedRuntime.voice.auto_start !== false) {
      try {
        await voiceController.start();
      } catch (error) {
        logger.warn("Voice controller failed to start", error);
      }
    }
  }

  try {
    if (options.user_input) {
      await handleUserInput(options.user_input);
    }
  } catch (error) {
    const err = error as Error;
    ErrorCenter.report("handleUserInput", err, "Verify intent/action configuration and DOM sections.");
    maybeTripGuard();
    await pipeline.run(
      "error",
      { stage: "handleUserInput", error: err },
      undefined,
      logger
    );
    await runHook(hooks?.onError, { stage: "handleUserInput", error: err }, "onError", logger);
    throw err;
  }

  return {
    config: indexConfig,
    registry: scanResult.registry,
    context,
    handleUserInput,
    voice: voiceController,
    getTrace: () => pipeline.getTrace(),
    shared: pipeline.shared
  };
}

export * from "./logger";
export * from "./runtime";
export * from "./providers";
export * from "./hooks";
export * from "./pipeline";
export * from "./plugins";
