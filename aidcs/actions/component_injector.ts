export function injectComponent(section: HTMLElement, componentName: string, props: Record<string, unknown>): void {
  const container = document.createElement("div");
  container.setAttribute("data-ai-component", componentName);
  container.setAttribute("data-ai-props", JSON.stringify(props));
  container.className = "aidcs-component";
  section.appendChild(container);
}
