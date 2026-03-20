import { DomRegistryEntry } from "../types";
import { DomTreeNode } from "../dom/types";
import { PageContext, PageMetadata } from "./types";

export function assemblePageContext(metadata: PageMetadata, registry: DomRegistryEntry[], domTree: DomTreeNode): PageContext {
  return {
    metadata,
    registry,
    dom_tree: domTree,
    timestamp: new Date().toISOString()
  };
}
