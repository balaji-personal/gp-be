import cloudinary from "../config/cloudinary.js";

function toDataUri(buffer: Buffer) {
  return `data:image/jpeg;base64,${buffer.toString("base64")}`;
}

export async function uploadMedia(buffer: Buffer, publicId: string) {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === "your_cloud_name") {
      return toDataUri(buffer);
    }
    const dataUri = toDataUri(buffer);
    const result = await cloudinary.uploader.upload(dataUri, {
      public_id: publicId,
      resource_type: "auto",
      overwrite: true,
    });
    return result.secure_url;
  } catch (error) {
    console.warn("Cloudinary fallback activated:", error);
    return toDataUri(buffer);
  }
}

