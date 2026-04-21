/** Same rules as Server/utils/postContent.js — keep in sync. */
export function stripHtmlToPlainText(html) {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\u200B/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function hasVisiblePostText(html) {
  return stripHtmlToPlainText(html).length > 0;
}
