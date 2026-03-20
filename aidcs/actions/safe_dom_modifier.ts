export class SafeDomModifier {
  private allowedSections: string[];

  constructor(allowedSections: string[]) {
    this.allowedSections = allowedSections;
  }

  getSectionElement(root: HTMLElement, sectionId: string): HTMLElement | null {
    return root.querySelector(`#${sectionId}`) as HTMLElement | null;
  }

  ensureAllowed(sectionId: string): void {
    if (!this.allowedSections.includes(sectionId)) {
      throw new Error(`Section not allowed: ${sectionId}`);
    }
  }
}
