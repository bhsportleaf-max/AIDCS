import { DomRegistryEntry } from "../types";
import { DomRegistryStore } from "./dom_registry_store";

export class DomRegistry {
  private store: DomRegistryStore;

  constructor(store: DomRegistryStore) {
    this.store = store;
  }

  async save(entries: DomRegistryEntry[]): Promise<void> {
    await this.store.write(entries);
  }

  async load(): Promise<DomRegistryEntry[] | null> {
    return await this.store.read();
  }
}
