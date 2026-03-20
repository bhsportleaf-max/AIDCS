import { SocketRouter } from "./socket_router";

export class SocketServer {
  private router: SocketRouter;

  constructor(router = new SocketRouter()) {
    this.router = router;
  }

  start(): void {
    if (typeof WebSocket === "undefined") {
      throw new Error("WebSocket not available in this runtime");
    }
  }

  receive(raw: string): void {
    const message = JSON.parse(raw) as { type: string; payload: unknown };
    this.router.route(message);
  }
}
