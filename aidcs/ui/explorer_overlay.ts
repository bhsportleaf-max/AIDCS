import { DomRegistryEntry, AIDCSArchitecture } from "../types";
import type { PipelineTraceEntry } from "../bootstrap/pipeline";
import type { Agent } from "../agents/types";

interface ExplorerOptions {
  registry: DomRegistryEntry[];
  agents: Agent[];
  architecture?: AIDCSArchitecture;
  getTrace: () => PipelineTraceEntry[];
}

const PANEL_ID = "aidcs-explorer-panel";
const BUTTON_ID = "aidcs-explorer-button";

export class ExplorerOverlay {
  private toggleKey: string;
  private options?: ExplorerOptions;
  private panel: HTMLElement | null = null;
  private button: HTMLElement | null = null;
  private open = false;

  constructor(toggleKey = "ALT+E") {
    this.toggleKey = toggleKey;
  }

  attach(options: ExplorerOptions): void {
    if (typeof document === "undefined") return;
    this.options = options;
    if (this.button) return;

    this.button = document.createElement("button");
    this.button.id = BUTTON_ID;
    this.button.textContent = "AIDCS Explorer";
    this.button.className = "aidcs-registry-button";
    this.button.addEventListener("click", () => this.toggle());
    document.body.appendChild(this.button);

    document.addEventListener("keydown", event => {
      if (event.altKey && event.key.toUpperCase() === this.toggleKey.replace("ALT+", "").toUpperCase()) {
        this.toggle();
      }
    });
  }

  refresh(): void {
    if (this.open) this.render();
  }

  private toggle(): void {
    this.open = !this.open;
    if (this.open) {
      this.render();
    } else {
      this.destroyPanel();
    }
  }

  private destroyPanel(): void {
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
  }

  private render(): void {
    if (!this.options || typeof document === "undefined") return;
    if (!this.panel) {
      this.panel = document.createElement("div");
      this.panel.id = PANEL_ID;
      this.panel.className = "aidcs-registry-panel";
      document.body.appendChild(this.panel);
    }

    const { registry, agents, architecture, getTrace } = this.options;
    const trace = getTrace();

    const layers = architecture?.default_sections
      ?.map(sec => `${sec.index}. ${sec.name} (${sec.short})`)
      .join(", ");

    const registryCount = registry.length;
    const agentList = agents
      .map(a => `${a.name} -> [${a.allowed_sections.join(", ")}]`)
      .join("\n");

    const traceRows = trace
      .map(t => `${t.stage}: ${t.duration_ms}ms`)
      .slice(-10)
      .join("\n");

    this.panel.innerHTML = `
      <strong>AIDCS Explorer</strong>
      <div style="margin:6px 0;border-bottom:1px solid #333;padding-bottom:6px;font-size:11px;">
        <div><b>Sections:</b> ${layers || "n/a"}</div>
        <div><b>Registry entries:</b> ${registryCount}</div>
        <div><b>Agents:</b></div>
        <pre style="white-space:pre-wrap;background:#0f172a;color:#e2e8f0;padding:6px;border:1px solid #334155;border-radius:4px;max-height:120px;overflow:auto;">${agentList}</pre>
        <div><b>Pipeline trace (last 10):</b></div>
        <pre style="white-space:pre-wrap;background:#0f172a;color:#e2e8f0;padding:6px;border:1px solid #334155;border-radius:4px;max-height:140px;overflow:auto;">${traceRows}</pre>
      </div>
      <div style="font-size:10px;opacity:0.7;">Toggle: ${this.toggleKey}</div>
    `;
  }
}
