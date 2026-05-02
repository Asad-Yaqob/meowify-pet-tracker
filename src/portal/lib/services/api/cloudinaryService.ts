import axios from 'axios';

const requiredEnv = (value: string | undefined, key: string) => {
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

const cloudName = requiredEnv(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME, 'VITE_CLOUDINARY_CLOUD_NAME');
const uploadPreset = requiredEnv(
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
  'VITE_CLOUDINARY_UPLOAD_PRESET',
);

export const uploadPetImage = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await axios.post<{ secure_url: string }>(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData,
    );
    return response.data.secure_url;
  } catch (error: any) {
    if (error.response?.data?.error?.message) {
      console.error('Cloudinary Error:', error.response.data.error.message);
      throw new Error(`Cloudinary: ${error.response.data.error.message}`);
    }
    throw error;
  }
};
