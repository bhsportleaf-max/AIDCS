import { PageMetadata } from "./types";

export function extractMetadata(doc?: Document): PageMetadata {
  const documentRef = doc || (typeof document !== "undefined" ? document : undefined);
  if (!documentRef) {
    return {
      title: "",
      url: "",
      description: "",
      language: ""
    };
  }

  const title = documentRef.title || "";
  const url = documentRef.location?.href || "";
  const description = documentRef.querySelector("meta[name='description']")?.getAttribute("content") || "";
  const language = documentRef.documentElement?.lang || "";

  return { title, url, description, language };
}
