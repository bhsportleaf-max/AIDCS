import { describe, it, expect, vi } from "vitest";
import { bootstrapAIDCS } from "./index";

describe("bootstrapAIDCS", () => {
  it("should initialize without options", async () => {
    const runtime = await bootstrapAIDCS();
    expect(runtime).toBeDefined();
    expect(runtime.handleUserInput).toBeDefined();
  });

  it("should call onConfigLoaded hook", async () => {
    const onConfigLoaded = vi.fn();
    const runtime = await bootstrapAIDCS({
      hooks: { onConfigLoaded },
    });

    expect(onConfigLoaded).toHaveBeenCalled();
    expect(runtime).toBeDefined();
  });

  it("should initialize plugins in order", async () => {
    const plugin1Init = vi.fn();
    const plugin2Init = vi.fn();

    await bootstrapAIDCS({
      plugins: [
        { name: "plugin1", initialize: plugin1Init },
        { name: "plugin2", initialize: plugin2Init },
      ],
    });

    expect(plugin1Init).toHaveBeenCalled();
    expect(plugin2Init).toHaveBeenCalled();
  });

  it("should handle user input", async () => {
    const runtime = await bootstrapAIDCS();
    const result = await runtime.handleUserInput("test input");

    expect(result.success).toBe(true);
    expect(result.intents).toBeDefined();
    expect(Array.isArray(result.intents)).toBe(true);
  });

  it("should pass through config", async () => {
    const config = { custom: "value" };
    const onConfigLoaded = vi.fn();

    await bootstrapAIDCS({
      config,
      hooks: { onConfigLoaded },
    });

    expect(onConfigLoaded).toHaveBeenCalledWith(config);
  });
});
