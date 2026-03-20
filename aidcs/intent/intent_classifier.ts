import { IntentResult } from "./types";

export class IntentClassifier {
  private minimumConfidence: number;

  constructor(minimumConfidence = 0.4) {
    this.minimumConfidence = minimumConfidence;
  }

  classify(result: IntentResult): IntentResult {
    if (result.confidence < this.minimumConfidence) {
      return { intent: "unknown", confidence: result.confidence, matched_keywords: result.matched_keywords };
    }
    return result;
  }
}
