import { AgentsConfig, ActionRegistry, ConfigProvider, IndexConfig, IntentMap, RuntimeConfig, SupervisorConfig } from "./types";

function parseNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function applyAgentEnvOverrides(config: AgentsConfig): AgentsConfig {
  const overridden = { ...config, agents: config.agents.map(agent => ({ ...agent })) };

  for (const agent of overridden.agents) {
    const keyBase = agent.name.toUpperCase();
    const sections = process.env[`AIDCS_AGENT_${keyBase}_SECTIONS`];
    const priority = process.env[`AIDCS_AGENT_${keyBase}_PRIORITY`];
    const maxActions = process.env[`AIDCS_AGENT_${keyBase}_MAX_ACTIONS`];
    const confidence = process.env[`AIDCS_AGENT_${keyBase}_CONFIDENCE`];

    if (sections) {
      agent.allowed_sections = sections.split(",").map(s => s.trim()).filter(Boolean);
    }
    const pVal = parseNumber(priority);
    if (pVal !== undefined) agent.priority = pVal;

    const mVal = parseNumber(maxActions);
    if (mVal !== undefined) agent.max_actions_per_cycle = mVal;

    const cVal = parseNumber(confidence);
    if (cVal !== undefined) agent.confidence_threshold = cVal;
  }

  const defaultAgent = process.env.AIDCS_DEFAULT_AGENT;
  if (defaultAgent) {
    overridden.agent_system.default_agent = defaultAgent;
  }

  return overridden;
}

async function readOptionalJson<T>(provider: ConfigProvider, path: string): Promise<T | null> {
  const exists = await provider.exists(path);
  if (!exists) {
    return null;
  }
  return (await provider.readJson(path)) as T;
}

export async function loadIndexConfig(provider: ConfigProvider, path = "index.json"): Promise<IndexConfig> {
  const data = await readOptionalJson<IndexConfig>(provider, path);
  if (!data) {
    throw new Error(`Missing required config: ${path}`);
  }
  return data;
}

export async function loadRuntimeConfig(provider: ConfigProvider, path = "config/index.json"): Promise<RuntimeConfig | null> {
  return await readOptionalJson<RuntimeConfig>(provider, path);
}

export async function loadEnvironmentConfig(
  provider: ConfigProvider,
  env: string,
  path = "config/environment.json"
): Promise<Record<string, unknown> | null> {
  const data = await readOptionalJson<{ environments?: Record<string, Record<string, unknown>> }>(provider, path);
  if (!data || !data.environments) {
    return null;
  }
  return data.environments[env] || null;
}

export async function loadAgentsConfig(provider: ConfigProvider, path = "config/agents/agents.json"): Promise<AgentsConfig> {
  const data = await readOptionalJson<AgentsConfig>(provider, path);
  if (!data) {
    throw new Error(`Missing required agents config: ${path}`);
  }
  return applyAgentEnvOverrides(data);
}

export async function loadActionRegistry(provider: ConfigProvider, path = "config/agents/action.json"): Promise<ActionRegistry> {
  const data = await readOptionalJson<ActionRegistry>(provider, path);
  if (!data) {
    throw new Error(`Missing required action registry: ${path}`);
  }
  return data;
}

export async function loadIntentMap(provider: ConfigProvider, path = "config/agents/intent_map.json"): Promise<IntentMap> {
  const data = await readOptionalJson<IntentMap>(provider, path);
  if (!data) {
    throw new Error(`Missing required intent map: ${path}`);
  }
  return data;
}

export async function loadSupervisorConfig(provider: ConfigProvider, path = "config/agents/supervisor.json"): Promise<SupervisorConfig> {
  const data = await readOptionalJson<SupervisorConfig>(provider, path);
  if (!data) {
    throw new Error(`Missing required supervisor config: ${path}`);
  }
  return data;
}
