export interface LoggedError {
  stage: string;
  message: string;
  stack?: string;
  hint?: string;
  timestamp: string;
}

type Listener = (errors: LoggedError[]) => void;

const MAX_ERRORS = 20;

class ErrorCenterImpl {
  private errors: LoggedError[] = [];
  private listeners: Set<Listener> = new Set();

  report(stage: string, error: Error, hint?: string): void {
    const entry: LoggedError = {
      stage,
      message: error.message,
      stack: error.stack,
      hint,
      timestamp: new Date().toISOString()
    };
    this.errors.unshift(entry);
    if (this.errors.length > MAX_ERRORS) this.errors.pop();
    this.emit();
  }

  list(): LoggedError[] {
    return [...this.errors];
  }

  count(): number {
    return this.errors.length;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.list());
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    const snapshot = this.list();
    this.listeners.forEach(listener => listener(snapshot));
  }
}

export const ErrorCenter = new ErrorCenterImpl();
