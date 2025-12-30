const cloudinary = require("../config/cloudinary");
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
    await cloudinary.uploader.destroy(publicId);
    console.log("file deleted from cloudinary")
  } catch (error) {
    console.error("Cloudinary Delete Error:", error);
    throw error;
  }
}

module.exports = { uploadToCloudinary, deleteFromCloudinary };
