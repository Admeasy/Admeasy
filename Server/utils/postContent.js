/**
 * True if HTML has any visible text (not just tags, &nbsp;, or breaks).
 * Used to reject "empty" rich-text posts that still stringify as non-empty.
 */
function stripHtmlToPlainText(html) {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\u200B/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function hasVisiblePostText(html) {
  return stripHtmlToPlainText(html).length > 0;
}

module.exports = { stripHtmlToPlainText, hasVisiblePostText };
