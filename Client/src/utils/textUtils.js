export function truncateHtml(html, maxWords) {
 // Graceful fallback for SSR or missing content
 if (!html || typeof window ==='undefined') {
 return { html: html ||'', hasMore: false };
 }

 // Create a dummy element to manipulate DOM safely
 const div = document.createElement('div');
 div.innerHTML = html;

 let currentWordCount = 0;
 let truncated = false;

 function traverse(node) {
 if (truncated) {
 if (node.parentNode) node.remove();
 return;
 }

 if (node.nodeType === Node.TEXT_NODE) {
 const text = node.textContent;
 // Match non-whitespace sequences
 const words = text.match(/\S+/g) || [];

 if (currentWordCount + words.length > maxWords) {
 const wordsNeeded = maxWords - currentWordCount;

 // Find the cut-off point
 let count = 0;
 let charIndex = 0;
 const regex = /\S+/g;
 let match;

 while ((match = regex.exec(text)) !== null) {
 count++;
 if (count > wordsNeeded) {
 // We found the word AFTER the last allowed word.
 // Wait, we want to include'wordsNeeded'words.
 break;
 }
 charIndex = match.index + match[0].length;
 }

 // If words1Needed is 0, we truncate entire node? 
 if (wordsNeeded === 0) {
 node.textContent ='';
 } else {
 node.textContent = text.substring(0, charIndex) +'...';
 }

 currentWordCount = maxWords;
 truncated = true;
 } else {
 currentWordCount += words.length;
 }
 } else if (node.nodeType === Node.ELEMENT_NODE) {
 // Traverse children
 // Convert to array to avoid live collection issues during removal
 const children = Array.from(node.childNodes);
 for (const child of children) {
 traverse(child);
 }
 }
 }

 traverse(div);

 return {
 html: div.innerHTML,
 hasMore: truncated
 };
}
