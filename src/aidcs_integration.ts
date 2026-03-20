import { bootstrapAIDCS, BootstrapOptions } from "../aidcs/bootstrap";

export interface IntegrationOptions extends BootstrapOptions {
  /** CSS selector for the input that drives the runtime. Defaults to `[data-aidcs-input]`. */
  inputSelector?: string;
  /** Skip wiring DOM events when you only want the runtime instance. */
  autoAttachInput?: boolean;
}

export interface IntegrationHandle {
  runtime: Awaited<ReturnType<typeof bootstrapAIDCS>>;
  /** Remove listeners added by `initAIDCS`. Safe to call even if no listeners were attached. */
  detachListeners: () => void;
}

function getDefaultInput(root: Document | HTMLElement, selector: string): HTMLInputElement | null {
  const scope: ParentNode = root instanceof Document ? root : root.ownerDocument ?? document;
  if (!scope) return null;
  return scope.querySelector(selector) as HTMLInputElement | null;
}

export async function initAIDCS(options: IntegrationOptions = {}): Promise<IntegrationHandle> {
  const runtime = await bootstrapAIDCS(options);

  const autoAttach = options.autoAttachInput !== false;
  const selector = options.inputSelector ?? "[data-aidcs-input]";

  if (!autoAttach || typeof document === "undefined") {
    return { runtime, detachListeners: () => undefined };
  }

  const scope = options.root ?? document;
  const input = getDefaultInput(scope, selector);

  if (!input) {
    return { runtime, detachListeners: () => undefined };
  }

  const trigger = async () => {
    await runtime.handleUserInput(input.value);
  };

  const onKeyUp = async (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      await trigger();
    }
  };

  input.addEventListener("change", trigger);
  input.addEventListener("keyup", onKeyUp);

  return {
    runtime,
    detachListeners: () => {
      input.removeEventListener("change", trigger);
      input.removeEventListener("keyup", onKeyUp);
    }
  };
}

export function startAIDCSOnDomReady(options: IntegrationOptions = {}): void {
  if (typeof document === "undefined") return;

  const start = () => {
    void initAIDCS(options);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
}
