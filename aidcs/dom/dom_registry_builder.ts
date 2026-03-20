import { DomRegistryEntry } from "../types";
import { extractContent } from "./content_extractor";
import { classifySection } from "./section_classifier";
import { SectionNode } from "./types";

function buildDomPath(element: Element): string {
  const parts: string[] = [];
  let current: Element | null = element;
  while (current && current.tagName.toLowerCase() !== "html") {
    const tag = current.tagName.toLowerCase();
    let part = tag;
    if (current.id) {
      part += `#${current.id}`;
    } else if (current.parentElement) {
      const siblings = Array.from(current.parentElement.children).filter(child => child.tagName === current!.tagName);
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        part += `:nth-of-type(${index})`;
      }
    }
    parts.unshift(part);
    current = current.parentElement;
  }
  return parts.join(" > ");
}

export class DomRegistryBuilder {
  build(sections: SectionNode[]): DomRegistryEntry[] {
    return sections.map(section => {
      const extracted = extractContent(section.element);
      const classification = classifySection(section.name, extracted);
      const contentTypes = [...extracted.content_types];
      if (!contentTypes.includes(classification)) {
        contentTypes.push(classification);
      }
      return {
        id: section.id,
        section_name: section.name,
        dom_path: buildDomPath(section.element),
        content_type: contentTypes.join(",") || "unknown"
      };
    });
  }
}
