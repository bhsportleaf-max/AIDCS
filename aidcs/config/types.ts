import { AIDCSArchitecture, AgentDefinition, ActionDefinition, IntentMapping } from "../types";

export interface IndexConfig {
  schema_version: string;
  project_identity?: {
    project_name: string;
    architecture_type: string;
    target_accuracy: number;
    framework_support?: string[];
  };
  governance_policy?: Record<string, unknown>;
  project_structure?: Record<string, unknown>;
  aidcs_architecture: AIDCSArchitecture;
  dom_intelligence_layer?: Record<string, unknown>;
  ai_context_layer?: Record<string, unknown>;
  intent_router?: Record<string, unknown>;
  agent_control_policy?: Record<string, unknown>;
  dom_registry?: {
    registry_file?: string;
    auto_generate?: boolean;
    required_fields?: string[];
  };
  development_tools?: Record<string, unknown>;
  build_optimization?: Record<string, unknown>;
  validation_pipeline?: string[];
  runtime_execution_flow?: string[];
  safety_rules?: {
    forbidden_ai_actions?: string[];
    allowed_ai_actions?: string[];
  };
  confidence_thresholds?: Record<string, number>;
}

export interface RuntimeConfig {
  runtime_mode?: string;
  dom_scanner?: {
    scan_depth?: number;
    auto_reindex_sections?: boolean;
  };
  development_overlay?: {
    enabled?: boolean;
    toggle_key?: string;
    inspector_key?: string;
    explorer_key?: string;
    font_size?: string;
    opacity?: number;
    display_section_labels?: boolean;
  };
  dom_registry?: {
    generate_file?: string;
    auto_generate?: boolean;
  };
  agents?: Record<string, { sections: string[] }>;
  metrics?: {
    enabled?: boolean;
  };
  kernel?: {
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
  };
  voice?: {
    enabled?: boolean;
    auto_start?: boolean;
    sample_ms?: number;
    stt_endpoint?: string;
    language?: string;
  };
  performance_guard?: {
    error_threshold?: number;
    disable_actions_on_trip?: boolean;
    disable_overlay_on_trip?: boolean;
  };
}

export interface AgentsConfig {
  schema_version: string;
  agent_system: {
    enabled: boolean;
    multi_agent_mode: boolean;
    max_parallel_agents: number;
    default_agent: string;
    global_confidence_threshold: number;
  };
  capability_sets: Record<string, string[]>;
  agents: AgentDefinition[];
  execution_policy: {
    execution_mode: string;
    agent_priority_order: string[];
    allow_parallel_execution: boolean;
    max_agent_runtime_ms: number;
  };
  safety_rules: {
    validate_section_permissions: boolean;
    validate_capabilities: boolean;
    reject_unknown_agents: boolean;
    forbidden_global_actions: string[];
  };
}

export interface ActionRegistry {
  schema_version: string;
  action_system: {
    enabled: boolean;
    strict_mode: boolean;
    reject_unknown_actions: boolean;
  };
  actions: ActionDefinition[];
  action_execution_rules?: Record<string, boolean>;
  security_rules?: Record<string, string[]>;
}

export interface IntentMap {
  intent_mappings: IntentMapping[];
}

export interface SupervisorConfig {
  schema_version: string;
  supervisor_system: {
    enabled: boolean;
    mode: string;
    description?: string;
  };
  supervisor_identity: {
    name: string;
    access_level: string;
    override_permissions: boolean;
  };
  agent_orchestration: {
    execution_strategy: string;
    max_active_agents: number;
    agent_priority_order: string[];
    parallel_execution: boolean;
    max_agent_runtime_ms: number;
  };
  decision_rules: Record<string, boolean>;
  conflict_resolution: {
    strategy: string;
    rules: Array<{ condition: string; resolution: string }>;
  };
  confidence_control: {
    minimum_confidence: number;
    auto_execute_threshold: number;
    require_user_confirmation_below: number;
  };
  resource_limits: {
    max_actions_per_cycle: number;
    max_agents_per_request: number;
    max_execution_depth: number;
  };
}

export interface ConfigProvider {
  readJson(path: string): Promise<unknown>;
  writeJson(path: string, data: unknown): Promise<void>;
  exists(path: string): Promise<boolean>;
}
