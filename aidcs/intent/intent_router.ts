import { IntentMapping } from "../types";
import { IntentDetector } from "./intent_detector";
import { IntentClassifier } from "./intent_classifier";
import { resolveIntent } from "./action_resolver";
import { ResolvedIntent } from "./types";

export class IntentRouter {
  private detector: IntentDetector;
  private classifier: IntentClassifier;
  private mappings: IntentMapping[];

  constructor(mappings: IntentMapping[], minimumConfidence = 0.4) {
    this.mappings = mappings;
    this.detector = new IntentDetector(mappings);
    this.classifier = new IntentClassifier(minimumConfidence);
  }

  route(input: string): ResolvedIntent {
    const detected = this.detector.detect(input);
    const classified = this.classifier.classify(detected);
    return resolveIntent(classified, this.mappings);
  }
}
