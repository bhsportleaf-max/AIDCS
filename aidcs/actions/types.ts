import { DomRegistryEntry, AgentAction, ActionExecutionResult } from "../types";

export interface ActionContext {
  root: HTMLElement;
  registry: DomRegistryEntry[];
}

export interface ActionEngineResult {
  results: ActionExecutionResult[];
  context: ActionContext;
  actions: AgentAction[];
}
