import { AIDCSArchitecture, SectionDefinition } from "../types";
import { SectionNode } from "./types";

const sectionTagHints: Record<string, string[]> = {
  header: ["header"],
  navigation: ["nav"],
  container: ["main", "section", "div"],
  display: ["section", "main", "div"],
  ai_panel: ["aside", "section", "div"],
  footer: ["footer"]
};

export class SectionManager {
  private architecture: AIDCSArchitecture;

  constructor(architecture: AIDCSArchitecture) {
    this.architecture = architecture;
  }

  applySections(root: HTMLElement): SectionNode[] {
    const sections: SectionNode[] = [];
    const defs = this.architecture.default_sections || [];

    defs.forEach(def => {
      const element = this.findSectionElement(root, def);
      if (!element) {
        return;
      }

      const sectionId = this.computeSectionId(def);
      if (this.architecture.auto_reindex_sections !== false || !element.id) {
        element.id = sectionId;
      }
      element.setAttribute("data-ai-sect", sectionId);
      element.setAttribute("data-ai-section-name", def.name);

      sections.push({
        id: sectionId,
        name: def.name,
        element,
        depth: this.getDepth(root, element)
      });
    });

    return sections;
  }

  computeSectionId(def: SectionDefinition): string {
    return this.architecture.section_format
      .replace("{index}", String(def.index))
      .replace("{short}", def.short);
  }

  private findSectionElement(root: HTMLElement, def: SectionDefinition): HTMLElement | null {
    const byName = root.querySelector(`[data-ai-section-name="${def.name}"]`) as HTMLElement | null;
    if (byName) return byName;

    const byId = root.querySelector(`[id^="${this.architecture.section_prefix}-"]`) as HTMLElement | null;
    if (byId && byId.id.endsWith(def.short)) {
      return byId;
    }

    const hints = sectionTagHints[def.name] || [];
    for (const tag of hints) {
      const candidate = root.querySelector(tag) as HTMLElement | null;
      if (candidate) return candidate;
    }

    return null;
  }

  private getDepth(root: HTMLElement, node: HTMLElement): number {
    let depth = 0;
    let current: HTMLElement | null = node;
    while (current && current !== root) {
      depth += 1;
      current = current.parentElement;
    }
    return depth;
  }
}
