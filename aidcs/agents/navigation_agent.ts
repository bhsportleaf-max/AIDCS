import { BaseAgent } from "./base_agent";
import { AgentAction } from "../types";
import { AgentContext } from "./types";

const ROUTE_ENV_KEYS: Record<string, string> = {
  navigate_home: "AIDCS_ROUTE_HOME",
  navigate_payments: "AIDCS_ROUTE_PAYMENTS",
  navigate_settings: "AIDCS_ROUTE_SETTINGS",
  navigate_support: "AIDCS_ROUTE_SUPPORT",
  navigate_dashboard: "AIDCS_ROUTE_DASHBOARD"
};

const DEFAULT_ROUTES: Record<string, string> = {
  navigate_home: "/",
  navigate_payments: "/billing",
  navigate_settings: "/settings",
  navigate_support: "/support",
  navigate_dashboard: "/dashboard"
};

export class NavigationAgent extends BaseAgent {
  planActions(context: AgentContext): AgentAction[] {
    const intentName = context.intent.intent;
    if (!intentName.startsWith("navigate_")) return [];

    // Try to resolve from DOM nav items first for page-specific menus.
    const domRoute = this.resolveRouteFromDom(context.user_input, context.intent.section);

    const envKey = ROUTE_ENV_KEYS[intentName];
    const route =
      domRoute ||
      (envKey && typeof process !== "undefined" ? process.env[envKey] : undefined) ||
      DEFAULT_ROUTES[intentName] ||
      "/";

    return [
      {
        name: "trigger_route_change",
        params: { route_path: route },
        section: context.intent.section,
        confidence: context.intent.confidence,
        agent: this.name
      }
    ];
  }

  private resolveRouteFromDom(userInput: string, navSectionId: string): string | null {
    if (typeof document === "undefined") return null;
    const navRoot =
      document.getElementById(navSectionId) ||
      document.querySelector(`[data-ai-sect="${navSectionId}"]`) ||
      document.querySelector("[data-ai-sect='AI-Sect-2-NAV']");
    if (!navRoot) return null;

    const keywords = userInput.toLowerCase().split(/\s+/).filter(Boolean);
    const links = Array.from(navRoot.querySelectorAll("a, button"));

    for (const link of links) {
      const text = (link.textContent || "").toLowerCase();
      const dataKeywords =
        ((link as HTMLElement).dataset?.routeKeywords || "")
          .toLowerCase()
          .split(",")
          .map(k => k.trim())
          .filter(Boolean);

      const matched =
        keywords.some(k => text.includes(k)) ||
        keywords.some(k => dataKeywords.some(dk => dk.includes(k) || k.includes(dk)));

      if (!matched) continue;

      const href = (link as HTMLAnchorElement).getAttribute("href");
      const route = href || (link as HTMLElement).dataset?.route;
      if (route) return route;
    }

    return null;
  }
}
