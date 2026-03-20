import { LlmProvider, LlmRequest, LlmResponse } from "../types";

const DEFAULT_MODEL = "gemini-pro";
const DEFAULT_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export class GeminiProvider implements LlmProvider {
  name = "gemini";
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = DEFAULT_MODEL) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async send(request: LlmRequest): Promise<LlmResponse> {
    if (!this.apiKey) {
      throw new Error("Gemini API key missing");
    }

    const url = `${DEFAULT_ENDPOINT}/${this.model}:generateContent?key=${this.apiKey}`;
    const body = {
      contents: [
        {
          parts: [{ text: request.prompt }]
        }
      ],
      generationConfig: {
        temperature: request.temperature ?? 0.4
      }
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      throw new Error(`Gemini request failed: ${res.status} ${res.statusText}`);
    }

    const json = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return { text, raw: json };
  }
}
