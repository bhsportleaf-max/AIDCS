export type SectionId = string;

export interface SectionDefinition {
  index: number;
  name: string;
  short: string;
}

export interface AIDCSArchitecture {
  section_prefix: string;
  section_format: string;
  default_sections: SectionDefinition[];
  auto_reindex_sections?: boolean;
  scan_dom_depth?: number;
  generate_dom_map?: boolean;
}

export interface DomRegistryEntry {
  id: string;
  section_name: string;
  dom_path: string;
  content_type: string;
}

export interface IntentMapping {
  intent: string;
  keywords: string[];
  agent: string;
  action: string;
  section: string;
}

export interface ActionDefinition {
  name: string;
  description: string;
  allowed_sections: string[];
  parameters: string[];
  dom_operation: string;
  class_name?: string;
}

export interface AgentDefinition {
  name: string;
  role: string;
  priority: number;
  access_level: string;
  capabilities: string[];
  allowed_sections: string[];
  forbidden_sections?: string[];
  confidence_threshold: number;
  max_actions_per_cycle: number;
  override_permissions?: boolean;
}

export interface AgentAction {
  name: string;
  params: Record<string, unknown>;
  section: string;
  confidence: number;
  agent: string;
}

export interface IntentDetection {
  intent: string;
  confidence: number;
  matched_keywords: string[];
}

export interface ActionExecutionResult {
  action: AgentAction;
  success: boolean;
  message?: string;
  data?: unknown;
}
