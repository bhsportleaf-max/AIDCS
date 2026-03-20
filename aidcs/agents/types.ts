import { AgentAction } from "../types";
import { PageContext } from "../context/types";
import { ResolvedIntent } from "../intent/types";

export interface AgentContext {
  intent: ResolvedIntent;
  page: PageContext;
  user_input: string;
}

export interface Agent {
  name: string;
  priority: number;
  allowed_sections: string[];
  capabilities: string[];
  planActions(context: AgentContext): AgentAction[];
}
