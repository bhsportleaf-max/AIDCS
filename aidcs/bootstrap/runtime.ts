import { DomRegistryEntry } from "../types";
import { PageContext } from "../context/types";
import { ActionExecutionResult } from "../types";
import { IndexConfig } from "../config/types";
import type { PipelineTraceEntry } from "./pipeline";
import type { VoiceController } from "../voice/voice_controller";

export interface AIDCSRuntime {
  config: IndexConfig;
  registry: DomRegistryEntry[];
  context: PageContext;
  handleUserInput(input: string): Promise<ActionExecutionResult[]>;
  voice?: VoiceController | null;
  getTrace(): PipelineTraceEntry[];
  shared: Record<string, unknown>;
}
