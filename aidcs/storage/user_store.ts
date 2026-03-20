export interface StoredPage {
  timestamp: string;
  url: string;
  title: string;
  description?: string;
  intent: unknown;
  user_input?: string;
  registry: unknown;
  needs_llm?: boolean;
  llm_prompt?: string;
  llm_response?: unknown;
}

async function getFs() {
  const mod = await import("fs");
  return mod.promises;
}

export async function persistUserPage(userId: string, payload: StoredPage): Promise<void> {
  if (typeof process === "undefined") return; // browser runtime: skip disk writes
  const fs = await getFs();
  const baseDir = `User/${userId}/pages`;
  await fs.mkdir(baseDir, { recursive: true });
  const stamp = payload.timestamp.replace(/[:.]/g, "-");
  const filePath = `${baseDir}/page-${stamp}.json`;
  const json = JSON.stringify(payload, null, 2);
  await fs.writeFile(filePath, json, "utf8");
}
