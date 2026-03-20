import { DomRegistryEntry } from "../types";
import { DomTreeNode } from "../dom/types";
import { assemblePageContext } from "./page_context_assembler";
import { extractMetadata } from "./metadata_extractor";
import { PageContext } from "./types";

export function buildContext(registry: DomRegistryEntry[], domTree: DomTreeNode, doc?: Document): PageContext {
  const metadata = extractMetadata(doc);
  return assemblePageContext(metadata, registry, domTree);
}
