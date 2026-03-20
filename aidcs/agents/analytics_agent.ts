import { BaseAgent } from "./base_agent";
import { AgentAction } from "../types";
import { AgentContext } from "./types";

export class AnalyticsAgent extends BaseAgent {
  planActions(context: AgentContext): AgentAction[] {
    if (!context.intent.intent) {
      return [];
    }

    return [
      {
        name: "record_navigation_event",
        params: {
          event_type: `intent:${context.intent.intent}`,
          timestamp: new Date().toISOString()
        },
        section: "AI-Sect-6-FTR",
        confidence: 0.99,
        agent: this.name
      }
    ];
  }
}
