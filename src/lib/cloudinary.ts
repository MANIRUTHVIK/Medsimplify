import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadReportToCloudinary(
  buffer: Buffer,
  filename: string,
  folder = "medsimplify/reports"
): Promise<{ url: string; publicId: string; resourceType: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        public_id: `${Date.now()}_${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`,
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Failed to upload file to Cloudinary"));
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: result.resource_type,
          });
        }
      }
    );

    uploadStream.end(buffer);
  });
}

export async function deleteReportFromCloudinary(
  publicId: string,
  resourceType = "image"
): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (err) {
    console.error("Failed to delete report from Cloudinary:", err);
  }
}
