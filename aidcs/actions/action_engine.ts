import { ActionRegistry } from "../config/types";
import { AgentAction, ActionExecutionResult } from "../types";
import { SafeDomModifier } from "./safe_dom_modifier";
import { updateSectionContent } from "./ui_updater";
import { injectComponent } from "./component_injector";
import { extractContent } from "../dom/content_extractor";

function mapDomOperation(operation: string): string {
  switch (operation) {
    case "read_dom":
      return "read_dom_sections";
    case "replace_content":
    case "router_navigation":
    case "add_class":
    case "append_element":
      return "update_display_sections";
    case "component_injection":
      return "inject_ai_components";
    case "ai_processing":
    case "log_event":
      return "update_display_sections";
    default:
      return "unknown";
  }
}

export class ActionEngine {
  private registry: ActionRegistry;
  private allowedActions: string[];

  constructor(registry: ActionRegistry, allowedActions: string[]) {
    this.registry = registry;
    this.allowedActions = allowedActions;
  }

  execute(actions: AgentAction[], root: HTMLElement): ActionExecutionResult[] {
    const results: ActionExecutionResult[] = [];
    const modifier = new SafeDomModifier(this.collectAllowedSections());

    for (const action of actions) {
      const definition = this.registry.actions.find(entry => entry.name === action.name);
      if (!definition) {
        results.push({ action, success: false, message: "Unknown action" });
        if (this.registry.action_system.strict_mode) {
          continue;
        }
      }

      if (definition) {
        const category = mapDomOperation(definition.dom_operation);
        if (category !== "unknown" && !this.allowedActions.includes(category)) {
          results.push({ action, success: false, message: "Action not allowed by policy" });
          continue;
        }

        if (!definition.allowed_sections.includes(action.section)) {
          results.push({ action, success: false, message: "Section not allowed for action" });
          continue;
        }

        try {
          modifier.ensureAllowed(action.section);
          const result = this.performAction(definition.dom_operation, action, root);
          results.push({ action, success: true, data: result });
        } catch (error) {
          results.push({ action, success: false, message: (error as Error).message });
        }
      }
    }

    return results;
  }

  private collectAllowedSections(): string[] {
    const sections = new Set<string>();
    for (const action of this.registry.actions) {
      action.allowed_sections.forEach(section => sections.add(section));
    }
    return Array.from(sections);
  }

  private performAction(operation: string, action: AgentAction, root: HTMLElement): unknown {
    switch (operation) {
      case "add_class": {
        const menuId = action.params.menu_id as string | undefined;
        if (!menuId) throw new Error("menu_id is required");
        const target = root.querySelector(`#${menuId}`) as HTMLElement | null;
        if (!target) throw new Error("menu_id not found");
        target.classList.add("ai-highlight");
        return { target: menuId };
      }
      case "router_navigation": {
        const route = action.params.route_path as string | undefined;
        if (!route) throw new Error("route_path is required");
        if (typeof window !== "undefined" && window.history) {
          window.history.pushState({}, "", route);
        }
        return { route };
      }
      case "read_dom": {
        const section = root.querySelector(`#${action.section}`) as HTMLElement | null;
        if (!section) throw new Error("section not found");
        return extractContent(section);
      }
      case "ai_processing": {
        const content = String(action.params.content_block || "");
        const summary = content.length > 120 ? `${content.slice(0, 117)}...` : content;
        return { summary };
      }
      case "append_element": {
        const section = root.querySelector(`#${action.section}`) as HTMLElement | null;
        if (!section) throw new Error("section not found");
        if (typeof document === "undefined") throw new Error("document not available");
        const message = String(action.params.message || "");
        const container = document.createElement("div");
        container.className = "aidcs-message";
        container.textContent = message;
        section.appendChild(container);
        return { appended: true };
      }
      case "replace_content": {
        const section = root.querySelector(`#${action.section}`) as HTMLElement | null;
        if (!section) throw new Error("section not found");
        const html = String(action.params.component || action.params.html || "");
        updateSectionContent(section, html);
        return { updated: true };
      }
      case "component_injection": {
        const section = root.querySelector(`#${action.section}`) as HTMLElement | null;
        if (!section) throw new Error("section not found");
        if (typeof document === "undefined") throw new Error("document not available");
        const name = String(action.params.component_name || "component");
        const props = (action.params.props || {}) as Record<string, unknown>;
        injectComponent(section, name, props);
        return { injected: true };
      }
      case "log_event": {
        const eventType = String(action.params.event_type || "event");
        const timestamp = String(action.params.timestamp || new Date().toISOString());
        if (typeof console !== "undefined") {
          console.log("[AIDCS] event", eventType, timestamp);
        }
        return { event_type: eventType, timestamp };
      }
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  }
}
