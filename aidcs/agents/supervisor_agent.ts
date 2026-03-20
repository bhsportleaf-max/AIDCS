import { AgentAction } from "../types";
import { AgentsConfig, SupervisorConfig } from "../config/types";
import { Agent, AgentContext } from "./types";

export class SupervisorAgent {
  private config: AgentsConfig;
  private supervisor: SupervisorConfig;

  constructor(config: AgentsConfig, supervisor: SupervisorConfig) {
    this.config = config;
    this.supervisor = supervisor;
  }

  coordinate(agents: Agent[], context: AgentContext): AgentAction[] {
    const priorityOrder = this.supervisor.agent_orchestration.agent_priority_order;
    const priorityMap = new Map(priorityOrder.map((name, index) => [name, index]));

    const sortedAgents = [...agents].sort((a, b) => {
      const pa = priorityMap.get(a.name) ?? a.priority;
      const pb = priorityMap.get(b.name) ?? b.priority;
      return pa - pb;
    });

    const maxAgents = Math.min(
      this.supervisor.agent_orchestration.max_active_agents,
      this.supervisor.resource_limits.max_agents_per_request
    );
    const activeAgents = sortedAgents.slice(0, maxAgents);
    let actions: AgentAction[] = [];

    for (const agent of activeAgents) {
      const planned = agent.planActions(context).filter(action => agent.allowed_sections.includes(action.section));
      actions = actions.concat(planned);
    }

    actions = actions.filter(action => action.confidence >= this.supervisor.confidence_control.minimum_confidence);

    actions = this.resolveConflicts(actions, priorityMap);

    if (actions.length > this.supervisor.resource_limits.max_execution_depth) {
      actions = actions.slice(0, this.supervisor.resource_limits.max_execution_depth);
    }

    if (actions.length > this.supervisor.resource_limits.max_actions_per_cycle) {
      actions = actions.slice(0, this.supervisor.resource_limits.max_actions_per_cycle);
    }

    return actions;
  }

  private resolveConflicts(actions: AgentAction[], priorityMap: Map<string, number>): AgentAction[] {
    const bySection = new Map<string, AgentAction>();

    for (const action of actions) {
      const existing = bySection.get(action.section);
      if (!existing) {
        bySection.set(action.section, action);
        continue;
      }

      const existingPriority = priorityMap.get(existing.agent) ?? 999;
      const newPriority = priorityMap.get(action.agent) ?? 999;

      if (newPriority < existingPriority) {
        bySection.set(action.section, action);
      } else if (newPriority === existingPriority && action.confidence > existing.confidence) {
        bySection.set(action.section, action);
      }
    }

    return Array.from(bySection.values());
  }
}
