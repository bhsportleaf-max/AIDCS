export class LocalStorageMemory {
  private prefix: string;

  constructor(prefix = "aidcs") {
    this.prefix = prefix;
  }

  set(key: string, value: string): void {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(`${this.prefix}:${key}`, value);
  }

  get(key: string): string | null {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(`${this.prefix}:${key}`);
  }

  remove(key: string): void {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(`${this.prefix}:${key}`);
  }
}
