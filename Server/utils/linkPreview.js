/**
 * Utility to detect and extract link preview information from URLs
 */

/**
 * Extract domain from URL
 */
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (e) {
    return null;
  }
}

/**
 * Detect platform type from URL
 */
function detectPlatform(url) {
  if (!url) return 'website';
  
  const domain = extractDomain(url);
  if (!domain) return 'website';
  
  // YouTube detection
  if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
    return 'youtube';
  }
  
  return 'website';
}

/**
 * Extract YouTube video ID from URL
 */
function extractYouTubeVideoId(url) {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('youtu.be')) {
      return urlObj.pathname.slice(1);
    }
    if (urlObj.hostname.includes('youtube.com')) {
      return urlObj.searchParams.get('v');
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Generate YouTube thumbnail URL
 */
function getYouTubeThumbnail(videoId) {
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

/**
 * Build a favicon URL using DuckDuckGo service
 */
function getFaviconUrl(domain) {
  if (!domain) return null;
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}

/**
 * Extract YouTube title from video ID (requires API call - simplified for now)
 * In production, you might want to use YouTube Data API
 */
async function getYouTubeTitle(videoId) {
  // For now, return null - can be enhanced with YouTube API
  // This would require YouTube Data API key
  return null;
}

/**
 * Detect URL in text content
 */
function detectUrl(text) {
  if (!text) return null;
  
  // URL regex pattern
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  
  if (matches && matches.length > 0) {
    return matches[0]; // Return first URL found
  }
  
  return null;
}

/**
 * Generate link preview data
 */
async function generateLinkPreview(url) {
  if (!url) return null;
  
  const platform = detectPlatform(url);
  const domain = extractDomain(url);
  
  const preview = {
    url: url,
    domain: domain,
    platform: platform,
    title: null,
    description: null,
    image: null,
    favicon: getFaviconUrl(domain),
  };
  
  // Handle YouTube links
  if (platform === 'youtube') {
    const videoId = extractYouTubeVideoId(url);
    if (videoId) {
      preview.image = getYouTubeThumbnail(videoId);
      preview.title = 'YouTube Video';
      // In production, fetch actual title using YouTube API
    }
  }
  
  // Basic fallback for non-YouTube links: show domain as title if nothing else
  if (platform === 'website' && !preview.title) {
    preview.title = domain || 'External Link';
  }
  
  return preview;
}

module.exports = {
  detectUrl,
  generateLinkPreview,
  extractDomain,
  detectPlatform,
  extractYouTubeVideoId,
  getYouTubeThumbnail,
  getFaviconUrl,
};

