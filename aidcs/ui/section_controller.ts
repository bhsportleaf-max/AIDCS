export function getSection(root: HTMLElement, sectionId: string): HTMLElement | null {
  return root.querySelector(`#${sectionId}`) as HTMLElement | null;
}
