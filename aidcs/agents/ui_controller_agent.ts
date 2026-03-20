import { BaseAgent } from "./base_agent";
import { AgentAction } from "../types";
import { AgentContext } from "./types";

export class UiControllerAgent extends BaseAgent {
  planActions(context: AgentContext): AgentAction[] {
    const action = context.intent.action;
    if (action !== "inject_ui_component" && action !== "update_display_section") {
      return [];
    }

    if (action === "inject_ui_component") {
      return [
        {
          name: "inject_ui_component",
          params: {
            component_name: "AidcsPanel",
            props: { intent: context.intent.intent }
          },
          section: context.intent.section,
          confidence: context.intent.confidence,
          agent: this.name
        }
      ];
    }

    return [
      {
        name: "update_display_section",
        params: {
          component: `<div class=\"aidcs-display\">Intent: ${context.intent.intent}</div>`
        },
        section: context.intent.section,
        confidence: context.intent.confidence,
        agent: this.name
      }
    ];
  }
}
