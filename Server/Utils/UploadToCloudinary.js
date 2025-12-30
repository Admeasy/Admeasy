const cloudinary = require("../config/Cloudinary");
const fs = require("fs");

async function uploadToCloudinary(localFilePath, folder) {
  if (!localFilePath) return null;

  try {
    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder,
      resource_type: "auto",
    });
    console.log("file uploaded to cloudinary")
    // Safe delete 
    fs.unlink(localFilePath, (err) => {
      if (err) {
        if (err.code === "ENOENT") {
          console.log("File already deleted:", localFilePath);
        } else {
          console.log("File delete error:", err);
        }
      }
    });

    return result.secure_url;

  } catch (error) {
    console.error("Cloudinary Upload Error:", error);

    //safe cleanup if file exists
    if (fs.existsSync(localFilePath)) {
      fs.unlink(localFilePath, () => {});
    }
    throw error;
  }
}
module.exports = uploadToCloudinary;
