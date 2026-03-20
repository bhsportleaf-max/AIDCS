import { LlmResponse } from "./types";

export function handleLlmResponse(response: LlmResponse): string {
  return response.text;
}
