import { LlmRequest } from "./types";

export class LlmRouter {
  route(request: LlmRequest): string {
    return request.model || "default";
  }
}
