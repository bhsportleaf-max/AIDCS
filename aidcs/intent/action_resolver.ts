import { IntentMapping } from "../types";
import { IntentResult, ResolvedIntent } from "./types";

export function resolveIntent(result: IntentResult, mappings: IntentMapping[]): ResolvedIntent {
  const mapping = mappings.find(entry => entry.intent === result.intent);
  if (!mapping) {
    return {
      intent: result.intent,
      agent: "assistant_agent",
      action: "display_chat_message",
      section: "AI-Sect-5-AIC",
      confidence: result.confidence
    };
  }

  return {
    intent: mapping.intent,
    agent: mapping.agent,
    action: mapping.action,
    section: mapping.section,
    confidence: result.confidence,
    mapping
  };
}
