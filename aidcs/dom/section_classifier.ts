import { ExtractedContent } from "./content_extractor";

export function classifySection(name: string, content: ExtractedContent): string {
  const lower = name.toLowerCase();
  if (lower.includes("nav")) return "navigation";
  if (lower.includes("header")) return "header";
  if (lower.includes("footer")) return "footer";
  if (lower.includes("ai")) return "ai_panel";
  if (content.form_count > 0) return "form_section";
  if (content.product_card_count > 0) return "product_display";
  return "content";
}
