
import { AspectRatio } from '../types';

export const cropImage = (imageSrc: string, aspectRatio: AspectRatio): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      let sourceX: number, sourceY: number, sourceWidth: number, sourceHeight: number;
      const originalWidth = img.width;
      const originalHeight = img.height;
      const originalAspectRatio = originalWidth / originalHeight;

      let targetAspectRatioValue: number;
      switch (aspectRatio) {
        case AspectRatio.Square:
          targetAspectRatioValue = 1;
          break;
        case AspectRatio.Horizontal:
          targetAspectRatioValue = 16 / 9;
          break;
        case AspectRatio.Vertical:
          targetAspectRatioValue = 9 / 16;
          break;
        default:
          targetAspectRatioValue = 1;
      }

      if (originalAspectRatio > targetAspectRatioValue) {
        // Original is wider than target, crop the sides (center crop)
        sourceHeight = originalHeight;
        sourceWidth = originalHeight * targetAspectRatioValue;
        sourceX = (originalWidth - sourceWidth) / 2;
        sourceY = 0;
      } else {
        // Original is taller than or equal to target, crop the top/bottom (center crop)
        sourceWidth = originalWidth;
        sourceHeight = originalWidth / targetAspectRatioValue;
        sourceX = 0;
        sourceY = (originalHeight - sourceHeight) / 2;
      }

      canvas.width = sourceWidth;
      canvas.height = sourceHeight;

      ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);

      // Use JPEG for smaller file size, which is better for API requests
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = (err) => reject(err);
    img.src = imageSrc;
  });
};

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};
