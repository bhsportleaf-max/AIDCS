import { BaseAgent } from "./base_agent";
import { AgentAction } from "../types";
import { AgentContext } from "./types";

export class AssistantAgent extends BaseAgent {
  planActions(context: AgentContext): AgentAction[] {
    if (context.intent.intent !== "assist_user" && context.intent.intent !== "unknown") {
      return [];
    }

    const message = context.intent.intent === "unknown"
      ? "How can I help?"
      : "Sure, I can help. What would you like to do?";

    return [
      {
        name: "display_chat_message",
        params: { message },
        section: context.intent.section,
        confidence: Math.max(0.6, context.intent.confidence),
        agent: this.name
      }
    ];
  }
}
