import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = async (
  base64: string,
): Promise<{ url: string; public_id: string }> => {
  const result = await cloudinary.uploader.upload(base64, {
    folder: "date-planner",
    transformation: [
      { width: 1200, height: 1200, crop: "limit" },
      { quality: "auto" },
    ],
  });
  return { url: result.secure_url, public_id: result.public_id };
};

export const deleteImage = async (public_id: string): Promise<void> => {
  await cloudinary.uploader.destroy(public_id);
};
