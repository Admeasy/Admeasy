/**
 * Helper functions for Cloudinary URL manipulation
 * Replaces cloudinary-build-url package dependency
 */

/**
 * Extract public ID from Cloudinary URL
 * @param {String} url - Cloudinary URL
 * @returns {String|null} - Public ID or null if invalid
 */
function extractPublicId(url) {
  if (!url || typeof url !== 'string') return null;
  
  try {
    // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/{type}/{version}/{public_id}.{format}
    // Or: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}.{format}
    
    // Check if it's a Cloudinary URL
    if (!url.includes('cloudinary.com')) return null;
    
    // Extract the path after /upload/ or /fetch/ or /raw/upload/
    const uploadMatch = url.match(/\/upload\/(.+)$/);
    const fetchMatch = url.match(/\/fetch\/(.+)$/);
    const rawMatch = url.match(/\/raw\/upload\/(.+)$/);
    
    let path = null;
    if (uploadMatch) path = uploadMatch[1];
    else if (fetchMatch) path = fetchMatch[1];
    else if (rawMatch) path = rawMatch[1];
    
    if (!path) return null;
    
    // Remove transformations (format: v1234567890/w_500,h_500,c_fill/...)
    // Remove version prefix if present
    path = path.replace(/^v\d+\//, '');
    
    // Remove transformations (format: w_500,h_500,c_fill/...)
    // Transformations are separated by / and end before the public_id
    // The public_id is typically the last segment or after transformations
    const segments = path.split('/');
    
    // Find the segment that looks like a public_id (contains folder structure)
    // Usually transformations are single segments, public_id can have folders
    let publicId = segments.join('/');
    
    // Remove file extension
    publicId = publicId.replace(/\.[^/.]+$/, '');
    
    return publicId || null;
  } catch (error) {
    console.error('Error extracting public ID from Cloudinary URL:', error);
    return null;
  }
}

module.exports = {
  extractPublicId,
};
