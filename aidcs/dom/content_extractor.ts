export interface ExtractedContent {
  text: string;
  content_types: string[];
  image_count: number;
  table_count: number;
  form_count: number;
  product_card_count: number;
}

export function extractContent(element: Element): ExtractedContent {
  const text = (element.textContent || "").trim();
  const image_count = element.querySelectorAll("img").length;
  const table_count = element.querySelectorAll("table").length;
  const form_count = element.querySelectorAll("form").length;
  const product_card_count = element.querySelectorAll("[data-product-card], .product-card").length;

  const content_types: string[] = [];
  if (text.length > 0) content_types.push("text");
  if (table_count > 0) content_types.push("tables");
  if (image_count > 0) content_types.push("images");
  if (product_card_count > 0) content_types.push("product_cards");
  if (form_count > 0) content_types.push("forms");

  return {
    text,
    content_types,
    image_count,
    table_count,
    form_count,
    product_card_count
  };
}
