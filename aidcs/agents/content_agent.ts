import { BaseAgent } from "./base_agent";
import { AgentAction } from "../types";
import { AgentContext } from "./types";
import { persistUserPage } from "../storage/user_store";
import { GeminiProvider } from "../llm/providers/gemini_provider";

export class ContentAgent extends BaseAgent {
  planActions(context: AgentContext): AgentAction[] {
    const actions: AgentAction[] = [];

    const summarySource = context.page.registry
      .map(entry => `${entry.section_name}: ${entry.content_type}`)
      .join("; ");

    // Persist page snapshot for the current user (Node/runtime only).
    this.persistSnapshot(context, summarySource);

    if (context.intent.intent === "summarize_page" || context.intent.intent === "read_section") {
      actions.push({
        name: "generate_summary",
        params: { content_block: summarySource || "No registry content available" },
        section: context.intent.section,
        confidence: context.intent.confidence,
        agent: this.name
      });
    }

    return actions;
  }

  private async persistSnapshot(context: AgentContext, summarySource: string): Promise<void> {
    try {
      const userId = (typeof process !== "undefined" && (process.env.AIDCS_USER_ID || process.env.USER || "guest")) || "guest";
      const needsLLM = context.page.registry.length === 0;
      const snapshot = {
        timestamp: new Date().toISOString(),
        url: context.page.metadata.url,
        title: context.page.metadata.title,
        description: context.page.metadata.description,
        intent: context.intent,
        user_input: context.user_input,
        registry: context.page.registry,
        needs_llm: needsLLM,
        llm_prompt: needsLLM ? this.buildPrompt(context, summarySource) : undefined
      };
      await persistUserPage(userId, snapshot);

      if (needsLLM) {
        // Fire-and-forget LLM enrichment; errors are swallowed to avoid blocking UI.
        this.generateWithGemini(userId, snapshot.llm_prompt || "", context.intent.section);
      }
    } catch {
      // Silent fail: storage not available (likely browser).
    }
  }

  private buildPrompt(context: AgentContext, summarySource: string): string {
    return [
      `URL: ${context.page.metadata.url}`,
      `Title: ${context.page.metadata.title}`,
      `Description: ${context.page.metadata.description || "n/a"}`,
      `User input: ${context.user_input || "n/a"}`,
      `Registry summary: ${summarySource || "n/a"}`,
      "Task: Generate a concise summary and key bullets capturing the main content and user intent."
    ].join("\n");
  }

  private async generateWithGemini(userId: string, prompt: string, fallbackSection: string): Promise<void> {
    try {
      const apiKey =
        (typeof process !== "undefined" && process.env.AIDCS_GEMINI_API_KEY) ||
        "AIzaSyAsp8TTElaHaP3uoEt22roikvsIAyuENtM";
      const provider = new GeminiProvider(apiKey);
      const response = await provider.send({ prompt });
      const fs = await import("../storage/user_store");
      await fs.persistUserPage(userId, {
        timestamp: new Date().toISOString(),
        url: "llm_generated",
        title: "LLM Content",
        description: "Generated from Gemini fallback",
        intent: { intent: "llm_enrichment" },
        registry: [],
        needs_llm: false,
        llm_prompt: prompt,
        llm_response: response
      });
      this.displayInPage(response.text, fallbackSection);
    } catch {
      // Do not throw; keep silent to avoid impacting user flow.
    }
  }

  private displayInPage(text: string, fallbackSection: string): void {
    if (typeof document === "undefined") return;
    const target =
      document.getElementById("AI-Sect-5-AIC") ||
      document.querySelector("[data-ai-sect='AI-Sect-5-AIC']") ||
      document.getElementById(fallbackSection) ||
      document.querySelector(`[data-ai-sect='${fallbackSection}']`);
    if (!target) return;
    const container = document.createElement("div");
    container.className = "aidcs-llm-msg";
    container.style.padding = "10px";
    container.style.margin = "8px 0";
    container.style.background = "#f8fafc";
    container.style.border = "1px solid #e2e8f0";
    container.style.borderRadius = "8px";
    container.innerText = text || "No response from LLM.";
    target.appendChild(container);
  }
}
