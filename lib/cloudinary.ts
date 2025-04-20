import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(file: File) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  const base64Data = buffer.toString('base64');
  const dataURI = `data:${file.type};base64,${base64Data}`;
  
  const result = await cloudinary.uploader.upload(dataURI, {
    folder: 'plants',
  });
  
  return result.secure_url;
}
