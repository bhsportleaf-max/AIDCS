import type { Logger } from "./logger";

// NOTE: PipelineEngine provides ordered middleware execution with timing traces.
// The goal is to let AIDCS stages be extended without changing core logic.

// NOTE: Each trace entry records one stage execution timing.
export interface PipelineTraceEntry {
  stage: string;
  start: string;
  end: string;
  duration_ms: number;
}

// NOTE: PipelineContext flows through middleware. `shared` is a cross-stage store.
export interface PipelineContext<T = unknown> {
  stage: string;
  payload: T;
  shared: Record<string, unknown>;
  trace: PipelineTraceEntry[];
  logger?: Logger;
}

// NOTE: Middleware receives a context and must call next() to continue the chain.
export type PipelineMiddleware<T = unknown> = (
  ctx: PipelineContext<T>,
  next: () => Promise<void>
) => void | Promise<void>;

// NOTE: Middleware can be registered per stage with an execution order.
export interface PipelineMiddlewareRegistration<T = unknown> {
  stage: string;
  order?: number;
  handler: PipelineMiddleware<T>;
}

// NOTE: PipelineEngine stores middleware by stage and runs them in order.
export class PipelineEngine {
  private middleware: Map<string, PipelineMiddlewareRegistration[]> = new Map();
  private trace: PipelineTraceEntry[] = [];
  readonly shared: Record<string, unknown> = {};

  // NOTE: Register a middleware handler for a stage.
  register(registration: PipelineMiddlewareRegistration): void {
    const current = this.middleware.get(registration.stage) || [];
    current.push(registration);
    current.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    this.middleware.set(registration.stage, current);
  }

  // NOTE: Convenience for bulk registration.
  registerMany(registrations: PipelineMiddlewareRegistration[]): void {
    for (const registration of registrations) {
      this.register(registration);
    }
  }

  // NOTE: Returns a copy of the execution trace.
  getTrace(): PipelineTraceEntry[] {
    return [...this.trace];
  }

  // NOTE: Run one stage through its middleware chain and optionally a finalizer.
  async run<T>(
    stage: string,
    payload: T,
    finalizer?: (ctx: PipelineContext<T>) => void | Promise<void>,
    logger?: Logger
  ): Promise<PipelineContext<T>> {
    const startTime = Date.now();
    const ctx: PipelineContext<T> = {
      stage,
      payload,
      shared: this.shared,
      trace: this.trace,
      logger
    };

    const handlers = (this.middleware.get(stage) || []).map(entry => entry.handler);
    let index = -1;

    // NOTE: Dispatch ensures middleware executes in order and next() cannot be called twice.
    const dispatch = async (i: number): Promise<void> => {
      if (i <= index) {
        throw new Error(`Pipeline next() called multiple times at stage ${stage}`);
      }
      index = i;
      const handler = handlers[i];
      if (handler) {
        await handler(ctx, () => dispatch(i + 1));
      } else if (finalizer) {
        await finalizer(ctx);
      }
    };

    await dispatch(0);

    const endTime = Date.now();
    this.trace.push({
      stage,
      start: new Date(startTime).toISOString(),
      end: new Date(endTime).toISOString(),
      duration_ms: endTime - startTime
    });

    return ctx;
  }
}
