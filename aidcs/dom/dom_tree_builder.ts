import { DomTreeNode } from "./types";

export function buildDomTree(root: Element, maxDepth: number, depth = 0): DomTreeNode {
  const node: DomTreeNode = {
    tag: root.tagName.toLowerCase(),
    id: root.id || undefined,
    classes: root.classList.length ? Array.from(root.classList) : undefined,
    children: [],
    text_length: root.textContent ? root.textContent.trim().length : 0
  };

  if (depth >= maxDepth) {
    return node;
  }

  const children = Array.from(root.children);
  node.children = children.map(child => buildDomTree(child, maxDepth, depth + 1));
  return node;
}
