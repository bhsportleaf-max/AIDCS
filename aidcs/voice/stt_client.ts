interface SttOptions {
  endpoint?: string;
  language?: string;
}

export class SttClient {
  private endpoint?: string;
  private language?: string;

  constructor(options: SttOptions = {}) {
    this.endpoint = options.endpoint;
    this.language = options.language;
  }

  async transcribe(audio: ArrayBuffer): Promise<string> {
    // If no endpoint is configured, return a placeholder.
    if (!this.endpoint || typeof fetch === "undefined") {
      return "";
    }

    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "audio/webm",
        "Accept": "application/json",
        ...(this.language ? { "X-Language": this.language } : {})
      },
      body: audio
    });

    if (!res.ok) {
      throw new Error(`STT request failed: ${res.status}`);
    }

    const data = (await res.json()) as { text?: string };
    return data.text || "";
  }
}
