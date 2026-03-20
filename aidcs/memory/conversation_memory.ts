export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export class ConversationMemory {
  private turns: ConversationTurn[] = [];

  add(role: "user" | "assistant", content: string): void {
    this.turns.push({ role, content, timestamp: new Date().toISOString() });
  }

  list(): ConversationTurn[] {
    return [...this.turns];
  }

  clear(): void {
    this.turns = [];
  }
}
