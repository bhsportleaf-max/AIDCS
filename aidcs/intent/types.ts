import { IntentMapping } from "../types";

export interface IntentResult {
  intent: string;
  confidence: number;
  matched_keywords: string[];
}

export interface ResolvedIntent {
  intent: string;
  agent: string;
  action: string;
  section: string;
  confidence: number;
  mapping?: IntentMapping;
}
