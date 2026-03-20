import { DomRegistryEntry } from "../types";
import { DomTreeNode } from "../dom/types";

export interface PageMetadata {
  title: string;
  url: string;
  description: string;
  language: string;
}

export interface PageContext {
  metadata: PageMetadata;
  registry: DomRegistryEntry[];
  dom_tree: DomTreeNode;
  timestamp: string;
}
