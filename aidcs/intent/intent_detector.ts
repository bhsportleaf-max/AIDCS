import { IntentMapping } from "../types";
import { IntentResult } from "./types";

export class IntentDetector {
  private mappings: IntentMapping[];

  constructor(mappings: IntentMapping[]) {
    this.mappings = mappings;
  }

  detect(input: string): IntentResult {
    const normalized = input.toLowerCase();
    let best: IntentResult = { intent: "unknown", confidence: 0, matched_keywords: [] };

    for (const mapping of this.mappings) {
      const matched = mapping.keywords.filter(keyword => normalized.includes(keyword.toLowerCase()));
      if (matched.length === 0) continue;
      const confidence = matched.length / mapping.keywords.length;
      if (confidence > best.confidence) {
        best = { intent: mapping.intent, confidence, matched_keywords: matched };
      }
    }

    return best;
  }
}
