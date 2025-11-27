import { Readable } from 'stream';
import cloudinary, { UploadApiResponse } from './cloudinary';

export const uploadBufferToCloudinary = (
  buffer: Buffer,
  folder = 'portfolio',
  options: Record<string, unknown> = {},
): Promise<UploadApiResponse> =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', ...options },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      },
    );

    // Convert Buffer → Readable Stream
    Readable.from(buffer).pipe(uploadStream);
  });

export const uploadUrlToCloudinary = (
  imageUrl: string,
  folder = 'portfolio',
  options: Record<string, unknown> = {},
): Promise<UploadApiResponse> =>
  cloudinary.uploader.upload(imageUrl, {
    folder,
    resource_type: 'image',
    ...options,
  });
