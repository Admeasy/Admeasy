/**
 * Process post content to convert @username mentions into clickable links
 * @param {string} htmlContent - The HTML content of the post
 * @returns {string} - HTML content with mentions converted to clickable links
 */
export function processMentions(htmlContent) {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return htmlContent;
  }

  // First, extract text nodes and process mentions in them
  // We'll use a more sophisticated approach: parse HTML and only replace in text nodes
  // For simplicity, we'll use a regex that avoids replacing inside HTML tags
  
  // Match @username patterns that are not inside HTML tags
  // This regex matches @username where username contains alphanumeric characters and underscores
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  
  // Split by HTML tags to process only text content
  const parts = htmlContent.split(/(<[^>]+>)/);
  
  return parts.map((part, index) => {
    // Skip HTML tags
    if (part.startsWith('<')) {
      return part;
    }
    
    // Process mentions in text content
    return part.replace(mentionRegex, (match, username) => {
      // Check if this mention is already inside a link (avoid double-linking)
      // We'll check the surrounding context
      const partIndex = htmlContent.indexOf(part);
      const beforePart = htmlContent.substring(Math.max(0, partIndex - 100), partIndex);
      const afterPart = htmlContent.substring(partIndex + part.length, partIndex + part.length + 100);
      
      // Skip if already inside an anchor tag
      if (beforePart.includes('<a') && !beforePart.includes('</a>')) {
        return match;
      }
      
      // Create clickable link with Admeasy theme color
      return `<a href="/${username}" class="mention-link" data-username="${username}">${match}</a>`;
    });
  }).join('');
}
