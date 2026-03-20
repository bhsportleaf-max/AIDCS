import { AgentsConfig } from "../config/types";
import { Agent } from "./types";
import { AssistantAgent } from "./assistant_agent";
import { NavigationAgent } from "./navigation_agent";
import { ContentAgent } from "./content_agent";
import { AnalyticsAgent } from "./analytics_agent";
import { UiControllerAgent } from "./ui_controller_agent";

export function buildAgentRegistry(config: AgentsConfig): Agent[] {
  const instances: Agent[] = [];

  for (const definition of config.agents) {
    switch (definition.name) {
      case "assistant_agent":
        instances.push(new AssistantAgent(definition.name, definition.priority, definition.allowed_sections, definition.capabilities));
        break;
      case "navigation_agent":
        instances.push(new NavigationAgent(definition.name, definition.priority, definition.allowed_sections, definition.capabilities));
        break;
      case "content_agent":
        instances.push(new ContentAgent(definition.name, definition.priority, definition.allowed_sections, definition.capabilities));
        break;
      case "analytics_agent":
        instances.push(new AnalyticsAgent(definition.name, definition.priority, definition.allowed_sections, definition.capabilities));
        break;
      case "ui_controller_agent":
        instances.push(new UiControllerAgent(definition.name, definition.priority, definition.allowed_sections, definition.capabilities));
        break;
      default:
        break;
    }
  }

  return instances;
}
