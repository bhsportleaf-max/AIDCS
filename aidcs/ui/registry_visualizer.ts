import { DomRegistryEntry } from "../types";

export class RegistryVisualizer {
  private panel: HTMLElement | null = null;
  private button: HTMLElement | null = null;

  attach(registry: DomRegistryEntry[]): void {
    if (typeof document === "undefined") return;
    if (this.button) return;

    this.button = document.createElement("button");
    this.button.textContent = "AIDCS Registry";
    this.button.className = "aidcs-registry-button";
    this.button.addEventListener("click", () => this.toggle(registry));

    document.body.appendChild(this.button);
  }

  toggle(registry: DomRegistryEntry[]): void {
    if (!this.panel) {
      this.panel = document.createElement("div");
      this.panel.className = "aidcs-registry-panel";
      const pre = document.createElement("pre");
      pre.textContent = JSON.stringify(registry, null, 2);
      this.panel.appendChild(pre);
      document.body.appendChild(this.panel);
      return;
    }

    if (this.panel.style.display === "none") {
      this.panel.style.display = "block";
    } else {
      this.panel.style.display = "none";
    }
  }
}
