import { Agent } from "./types";
import { AgentContext } from "./types";
import { AgentAction } from "../types";

export abstract class BaseAgent implements Agent {
  name: string;
  priority: number;
  allowed_sections: string[];
  capabilities: string[];

  constructor(name: string, priority: number, allowed_sections: string[], capabilities: string[]) {
    this.name = name;
    this.priority = priority;
    this.allowed_sections = allowed_sections;
    this.capabilities = capabilities;
  }

  abstract planActions(context: AgentContext): AgentAction[];
}
