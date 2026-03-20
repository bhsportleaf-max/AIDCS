import { IndexConfig } from "./types";

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

export function validateIndexConfig(config: IndexConfig): ValidationResult {
  const errors: string[] = [];

  if (!config.schema_version) {
    errors.push("schema_version is required");
  }

  if (!config.project_identity || !config.project_identity.project_name) {
    errors.push("project_identity.project_name is required");
  }

  if (!config.aidcs_architecture) {
    errors.push("aidcs_architecture is required");
  } else {
    if (!config.aidcs_architecture.section_prefix) {
      errors.push("aidcs_architecture.section_prefix is required");
    }
    if (!config.aidcs_architecture.section_format) {
      errors.push("aidcs_architecture.section_format is required");
    }
    if (!config.aidcs_architecture.default_sections || config.aidcs_architecture.default_sections.length === 0) {
      errors.push("aidcs_architecture.default_sections must not be empty");
    }
  }

  if (!config.validation_pipeline || config.validation_pipeline.length === 0) {
    errors.push("validation_pipeline is required");
  }

  if (!config.runtime_execution_flow || config.runtime_execution_flow.length < 3) {
    errors.push("runtime_execution_flow must include at least 3 steps");
  }

  if (!config.safety_rules) {
    errors.push("safety_rules is required");
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertValidIndexConfig(config: IndexConfig): void {
  const result = validateIndexConfig(config);
  if (!result.ok) {
    throw new Error(`Invalid index config: ${result.errors.join(", ")}`);
  }
}
