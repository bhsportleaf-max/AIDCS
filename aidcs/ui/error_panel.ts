import { ErrorCenter, LoggedError } from "../errors/error_center";

const PANEL_ID = "aidcs-error-panel";
const BUTTON_ID = "aidcs-error-button";

export class ErrorPanel {
  private panel: HTMLElement | null = null;
  private button: HTMLElement | null = null;
  private open = false;
  private unsubscribe: (() => void) | null = null;
  private toggleKey: string;

  constructor(toggleKey = "ALT+D") {
    this.toggleKey = toggleKey;
  }

  attach(): void {
    if (typeof document === "undefined") return;
    if (this.button) return;

    this.button = document.createElement("button");
    this.button.id = BUTTON_ID;
    this.button.textContent = "AIDCS Errors";
    this.button.className = "aidcs-registry-button";
    this.button.style.right = "140px"; // avoid overlap with registry button
    this.button.addEventListener("click", () => this.toggle());
    document.body.appendChild(this.button);

    document.addEventListener("keydown", event => {
      if (event.altKey && event.key.toUpperCase() === this.toggleKey.replace("ALT+", "").toUpperCase()) {
        this.toggle();
      }
    });

    this.unsubscribe = ErrorCenter.subscribe(errors => {
      if (this.open) this.render(errors);
    });
  }

  detach(): void {
    if (this.unsubscribe) this.unsubscribe();
    this.destroyPanel();
    if (this.button) {
      this.button.remove();
      this.button = null;
    }
  }

  private toggle(): void {
    this.open = !this.open;
    if (this.open) {
      this.render(ErrorCenter.list());
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

  private render(errors: LoggedError[]): void {
    if (typeof document === "undefined") return;
    if (!this.panel) {
      this.panel = document.createElement("div");
      this.panel.id = PANEL_ID;
      this.panel.className = "aidcs-registry-panel";
      document.body.appendChild(this.panel);
    }

    if (errors.length === 0) {
      this.panel.innerHTML = "<strong>No AIDCS errors</strong>";
      return;
    }

    const list = errors
      .map(
        err => `
          <div style="margin-bottom:8px;padding:8px;border:1px solid #334155;border-radius:6px;background:#0f172a;">
            <div style="font-weight:700;color:#f87171;">${err.stage}</div>
            <div style="font-size:12px;color:#e2e8f0;">${err.message}</div>
            ${err.hint ? `<div style="font-size:11px;color:#a5f3fc;margin-top:4px;">Fix: ${err.hint}</div>` : ""}
            <div style="font-size:10px;opacity:0.7;margin-top:4px;">${err.timestamp}</div>
          </div>
        `
      )
      .join("");

    this.panel.innerHTML = `
      <strong>AIDCS Error Center</strong>
      <div style="font-size:10px;opacity:0.7;margin:4px 0;">Toggle: ${this.toggleKey}</div>
      <div style="max-height:320px;overflow:auto;">${list}</div>
    `;
  }
}
