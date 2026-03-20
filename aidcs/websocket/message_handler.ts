import { SocketMessage } from "./types";

export class MessageHandler {
  handle(message: SocketMessage): void {
    if (typeof console !== "undefined") {
      console.log("[AIDCS] socket message", message.type, message.payload);
    }
  }
}
