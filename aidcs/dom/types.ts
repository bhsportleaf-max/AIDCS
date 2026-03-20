export interface SectionNode {
  id: string;
  name: string;
  element: HTMLElement;
  depth: number;
}

export interface DomTreeNode {
  tag: string;
  id?: string;
  classes?: string[];
  children: DomTreeNode[];
  text_length: number;
}
