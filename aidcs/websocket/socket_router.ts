import { SocketMessage } from "./types";
import { MessageHandler } from "./message_handler";

export class SocketRouter {
  private handler: MessageHandler;

  constructor(handler = new MessageHandler()) {
    this.handler = handler;
  }

  route(message: SocketMessage): void {
    this.handler.handle(message);
  }
}
