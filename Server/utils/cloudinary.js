const cloudinary = require("../config/cloudinary");

/**
 * Extract public ID from Cloudinary URL
 * @param {String} imageUrl - Cloudinary URL
 * @returns {String|null} - Public ID or null if invalid
 */
function extractPublicId(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  
  try {
    // Check if it's a Cloudinary URL
    if (!imageUrl.includes('cloudinary.com')) return null;
    
    // Extract the path after /upload/, /fetch/, or /raw/upload/
    const uploadMatch = imageUrl.match(/\/upload\/(.+)$/);
    const fetchMatch = imageUrl.match(/\/fetch\/(.+)$/);
    const rawMatch = imageUrl.match(/\/raw\/upload\/(.+)$/);
    
    let path = null;
    if (uploadMatch) path = uploadMatch[1];
    else if (fetchMatch) path = fetchMatch[1];
    else if (rawMatch) path = rawMatch[1];
    
    if (!path) return null;
    
    // Remove version prefix if present (format: v1234567890/)
    path = path.replace(/^v\d+\//, '');
    
    // Remove transformations (format: w_500,h_500,c_fill/...)
    // Transformations are typically single segments before the public_id
    const segments = path.split('/');
    
    // Find segments that are transformations (contain underscores and numbers/letters)
    // Transformations usually look like: w_500, h_500, c_fill, etc.
    // Public ID segments typically don't have this pattern
    let publicIdSegments = [];
    let foundPublicId = false;
    
    for (const segment of segments) {
      // If segment looks like a transformation (has underscore and is short), skip it
      // Transformations: w_500, h_500, c_fill, q_auto, f_auto, etc.
      if (!foundPublicId && /^[a-z]_[a-z0-9_]+$/i.test(segment) && segment.length < 20) {
        continue; // Skip transformation
      }
      // Once we find a non-transformation segment, everything after is public_id
      foundPublicId = true;
      publicIdSegments.push(segment);
    }
    
    if (publicIdSegments.length === 0) return null;
    
    let publicId = publicIdSegments.join('/');
    
    // Remove file extension
    publicId = publicId.replace(/\.[^/.]+$/, '');
    
    return publicId || null;
  } catch (error) {
    console.error('Error extracting public ID from Cloudinary URL:', error);
    return null;
  }
}
const fs = require("fs");
const path = require("path");
const os = require("os");

async function uploadToCloudinary(fileInput, folder) {
  if (!fileInput) return null;

  let tempFilePath = null;
  let isTempFile = false;

  try {
    // If fileInput is a buffer (from memory storage), create a temporary file
    if (Buffer.isBuffer(fileInput)) {
      const tempDir = os.tmpdir();
      const tempFileName = `temp-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
      tempFilePath = path.join(tempDir, tempFileName);
      fs.writeFileSync(tempFilePath, fileInput);
      isTempFile = true;
    } else if (typeof fileInput === 'string') {
      // It's a file path
      tempFilePath = fileInput;
      isTempFile = false;
    } else {
      throw new Error('Invalid file input: expected buffer or file path');
    }

    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(tempFilePath, {
      folder,
      resource_type: "auto",
    });
    console.log("file uploaded to cloudinary")
    
    // Safe delete - only delete if we created a temp file
    if (isTempFile && fs.existsSync(tempFilePath)) {
      fs.unlink(tempFilePath, (err) => {
        if (err) {
          if (err.code === "ENOENT") {
            console.log("File already deleted:", tempFilePath);
          } else {
            console.log("File delete error:", err);
          }
        }
      });
    } else if (!isTempFile && fs.existsSync(tempFilePath)) {
      // Delete the original file if it was provided as a path
      fs.unlink(tempFilePath, (err) => {
        if (err) {
          if (err.code === "ENOENT") {
            console.log("File already deleted:", tempFilePath);
          } else {
            console.log("File delete error:", err);
          }
        }
      });
    }

    return result.secure_url;

  } catch (error) {
    console.error("Cloudinary Upload Error:", error);

    //safe cleanup if temp file exists
    if (isTempFile && tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlink(tempFilePath, () => {});
    }
    throw error;
  }
}

async function deleteFromCloudinary(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result === 'ok') {
      console.log("File deleted from Cloudinary: ", publicId);
      return { success: true, result };
    } else if (result.result === 'not found') {
      console.log("File not found in Cloudinary: ", publicId);
      return { success: false, result, message: 'File not found' };
    } else {
      console.warn("Unexpected result from Cloudinary delete:", result);
      return { success: false, result };
    }
  } catch (error) {
    console.error("Cloudinary Delete Error:", error);
    throw error;
  }
}

module.exports = { uploadToCloudinary, deleteFromCloudinary, extractPublicId };