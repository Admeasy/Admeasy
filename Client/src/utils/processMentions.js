/**
 * Process post content to convert @username mentions into clickable links
 * @param {string} htmlContent - The HTML content of the post
 * @returns {string} - HTML content with mentions converted to clickable links
 */
export function processMentions(htmlContent) {
  if (!htmlContent || typeof htmlContent !== "string") {
    // return htmlContent;
    return ""; // Return empty string if content is falsy or not a string
  }

  // First, extract text nodes and process mentions in them
  // We'll use a more sophisticated approach: parse HTML and only replace in text nodes
  // For simplicity, we'll use a regex that avoids replacing inside HTML tags

  // Match @username patterns that are not inside HTML tags
  // This regex matches @username where username contains alphanumeric characters and underscores
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;

  // Split by HTML tags to process only text content
  const parts = htmlContent.split(/(<[^>]+>)/);

  return parts
    .map((part, index) => {
      // Check if it's an HTML tag
      if (part.startsWith("<")) {
        // Check if it's an iframe with a sandbox attribute
        if (
          part.toLowerCase().startsWith("<iframe") &&
          part.toLowerCase().includes("sandbox=")
        ) {
          // It has a sandbox attribute, let's ensure it has the required permissions
          return part.replace(
            /sandbox=(['"])(.*?)\1/i,
            (match, quote, content) => {
              const permissions = new Set(content.split(" "));
              permissions.add("allow-forms");
              permissions.add("allow-scripts");
              permissions.add("allow-same-origin"); // Often needed for embeds
              permissions.add("allow-popups");
              permissions.add("allow-presentation");
              return `sandbox=${quote}${Array.from(permissions).join(
                " ",
              )}${quote}`;
            },
          );
        }
        return part;
      }

      // Process mentions in text content
      return part.replace(mentionRegex, (match, username) => {
        // Check if this mention is already inside a link (avoid double-linking)
        // We'll check the surrounding context
        const partIndex = htmlContent.indexOf(part);
        const beforePart = htmlContent.substring(
          Math.max(0, partIndex - 100),
          partIndex,
        );
        const afterPart = htmlContent.substring(
          partIndex + part.length,
          partIndex + part.length + 100,
        );

        // Skip if already inside an anchor tag
        if (beforePart.includes("<a") && !beforePart.includes("</a>")) {
          return match;
        }

        // Create clickable link with Admeasy theme color
        return `<a href="/${username}" class="mention-link" data-username="${username}">${match}</a>`;
      });
    })
    .join("");
}
