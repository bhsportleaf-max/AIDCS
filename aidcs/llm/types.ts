export interface LlmRequest {
  prompt: string;
  model?: string;
  temperature?: number;
}

export interface LlmResponse {
  text: string;
  raw?: unknown;
}

export interface LlmProvider {
  name: string;
  send(request: LlmRequest): Promise<LlmResponse>;
  // Optional health check to mark provider availability before routing traffic.
  healthCheck?: () => Promise<boolean>;
}
