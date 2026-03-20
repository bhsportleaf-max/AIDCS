import { AIDCSArchitecture, DomRegistryEntry } from "../types";
import { buildDomTree } from "./dom_tree_builder";
import { DomRegistryBuilder } from "./dom_registry_builder";
import { SectionManager } from "./section_manager";
import { DomTreeNode, SectionNode } from "./types";

export interface DomScanResult {
  sections: SectionNode[];
  registry: DomRegistryEntry[];
  tree: DomTreeNode;
}

export class DomScanner {
  private sectionManager: SectionManager;
  private registryBuilder: DomRegistryBuilder;
  private maxDepth: number;

  constructor(architecture: AIDCSArchitecture) {
    this.sectionManager = new SectionManager(architecture);
    this.registryBuilder = new DomRegistryBuilder();
    this.maxDepth = architecture.scan_dom_depth || 6;
  }

  scan(root: HTMLElement): DomScanResult {
    const sections = this.sectionManager.applySections(root);
    const registry = this.registryBuilder.build(sections);
    const tree = buildDomTree(root, this.maxDepth);

    return {
      sections,
      registry,
      tree
    };
  }
}
