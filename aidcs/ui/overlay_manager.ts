const OVERLAY_CLASS = "aidcs-overlay-enabled";
const STYLE_ID = "aidcs-overlay-style";
const INSPECT_TIP_ID = "aidcs-inspect-tip";

export class OverlayManager {
  private enabled = false;
  private toggleKey: string;
  private inspectKey: string;
  private inspectorActive = false;
  private tipEl: HTMLElement | null = null;
  // Arrow functions keep `this` bound for add/removeEventListener.
  private handleMouseMove = (event: MouseEvent) => this.updateTip(event);

  constructor(toggleKey = "ALT+A", inspectKey = "ALT+S") {
    this.toggleKey = toggleKey;
    this.inspectKey = inspectKey;
  }

  init(): void {
    if (typeof document === "undefined") return;
    this.injectStyles();
    document.addEventListener("keydown", event => {
      if (this.isToggleEvent(event)) {
        this.toggle();
      } else if (this.isInspectEvent(event)) {
        this.toggleInspector();
      }
    });
  }

  enable(): void {
    if (typeof document === "undefined") return;
    document.documentElement.classList.add(OVERLAY_CLASS);
    this.enabled = true;
  }

  disable(): void {
    if (typeof document === "undefined") return;
    document.documentElement.classList.remove(OVERLAY_CLASS);
    this.enabled = false;
  }

  toggle(): void {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  private isToggleEvent(event: KeyboardEvent): boolean {
    if (!event.altKey) return false;
    return event.key.toUpperCase() === "A";
  }

  private isInspectEvent(event: KeyboardEvent): boolean {
    if (!event.altKey) return false;
    return event.key.toUpperCase() === this.inspectKey.replace("ALT+", "").toUpperCase();
  }

  private toggleInspector(): void {
    // Inspector lets developers hover to see exact data-ai-sect IDs without opening DevTools.
    if (typeof document === "undefined") return;
    this.inspectorActive = !this.inspectorActive;

    if (this.inspectorActive) {
      if (!this.tipEl) this.createTip();
      document.addEventListener("mousemove", this.handleMouseMove);
    } else {
      document.removeEventListener("mousemove", this.handleMouseMove);
      this.hideTip();
    }
  }

  private createTip(): void {
    const tip = document.createElement("div");
    tip.id = INSPECT_TIP_ID;
    tip.style.display = "none";
    document.body.appendChild(tip);
    this.tipEl = tip;
  }

  private updateTip(event: MouseEvent): void {
    if (!this.tipEl) return;
    const target = event.target as HTMLElement | null;
    const sectionEl = target?.closest?.("[data-ai-sect]") as HTMLElement | null;
    if (!sectionEl) {
      this.hideTip();
      return;
    }

    const id = sectionEl.getAttribute("data-ai-sect") || "unknown";
    this.tipEl.textContent = id;
    this.tipEl.style.display = "block";
    this.tipEl.style.left = `${event.clientX + 12}px`;
    this.tipEl.style.top = `${event.clientY + 12}px`;
  }

  private hideTip(): void {
    if (this.tipEl) {
      this.tipEl.style.display = "none";
    }
  }

  private injectStyles(): void {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .${OVERLAY_CLASS} [data-ai-sect] {
        outline: 1px dashed rgba(0, 160, 255, 0.7);
        position: relative;
      }
      .${OVERLAY_CLASS} [data-ai-sect]::before {
        content: attr(data-ai-sect);
        position: absolute;
        top: 0;
        left: 0;
        font-size: 10px;
        padding: 2px 4px;
        background: rgba(0, 0, 0, 0.7);
        color: #fff;
        z-index: 9999;
        pointer-events: none;
      }
      .aidcs-registry-button {
        position: fixed;
        bottom: 16px;
        right: 16px;
        padding: 6px 10px;
        background: #111;
        color: #fff;
        border: 1px solid #444;
        border-radius: 4px;
        cursor: pointer;
        z-index: 10000;
      }
      .aidcs-registry-panel {
        position: fixed;
        bottom: 60px;
        right: 16px;
        max-width: 420px;
        max-height: 60vh;
        overflow: auto;
        background: #0b0b0b;
        color: #eaeaea;
        border: 1px solid #333;
        padding: 10px;
        z-index: 10000;
        font-size: 11px;
      }
      #${INSPECT_TIP_ID} {
        position: fixed;
        padding: 6px 10px;
        background: #0f172a;
        color: #e2e8f0;
        border: 1px solid #334155;
        border-radius: 6px;
        font-size: 12px;
        box-shadow: 0 8px 30px rgba(15, 23, 42, 0.25);
        pointer-events: none;
        z-index: 10001;
        opacity: 0.95;
      }
    `;

    document.head.appendChild(style);
  }
}
