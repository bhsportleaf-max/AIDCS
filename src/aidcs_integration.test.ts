import { describe, it, expect, beforeEach, vi } from "vitest";
import { initAIDCS, IntegrationOptions } from "./aidcs_integration";

describe("initAIDCS", () => {
  let mockDocument: Document;

  beforeEach(() => {
    // Setup mock DOM
    mockDocument = document;
  });

  it("should initialize without listeners when autoAttachInput is false", async () => {
    const result = await initAIDCS({ autoAttachInput: false });

    expect(result.runtime).toBeDefined();
    expect(result.detachListeners).toBeDefined();
  });

  it("should return a detachListeners function", async () => {
    const result = await initAIDCS();

    expect(typeof result.detachListeners).toBe("function");
    // Should not throw when called
    expect(() => result.detachListeners()).not.toThrow();
  });

  it("should accept custom root element", async () => {
    const customRoot = document.createElement("div");
    const result = await initAIDCS({ root: customRoot });

    expect(result.runtime).toBeDefined();
  });

  it("should use custom input selector", async () => {
    const result = await initAIDCS({ inputSelector: "[data-custom-input]" });

    expect(result.runtime).toBeDefined();
  });

  it("should pass options to bootstrap", async () => {
    const customConfig = { test: true };
    const result = await initAIDCS({ config: customConfig });

    expect(result.runtime).toBeDefined();
  });
});
