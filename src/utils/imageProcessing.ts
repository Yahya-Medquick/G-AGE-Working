export const MAX_IMAGE_UPLOAD_BYTES = 20 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 1600;

export function validateImageFile(file: Pick<File, 'type' | 'size'>): string | null {
  if (!file.type.startsWith('image/')) return 'Choose an image file (JPEG, PNG, or another supported image format).';
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) return 'Images must be 20 MB or smaller.';
  return null;
}

export function getResizedDimensions(width: number, height: number, maxDimension = MAX_IMAGE_DIMENSION) {
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function cropImageToJpeg(
  source: string,
  crop?: { x: number; y: number; width: number; height: number }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const sourceX = crop ? Math.max(0, crop.x) : 0;
      const sourceY = crop ? Math.max(0, crop.y) : 0;
      const sourceWidth = crop ? Math.min(crop.width, image.naturalWidth - sourceX) : image.naturalWidth;
      const sourceHeight = crop ? Math.min(crop.height, image.naturalHeight - sourceY) : image.naturalHeight;
      if (sourceWidth <= 0 || sourceHeight <= 0) {
        reject(new Error('The selected crop is empty.'));
        return;
      }

      const dimensions = getResizedDimensions(sourceWidth, sourceHeight);
      const canvas = document.createElement('canvas');
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Image processing is unavailable in this browser.'));
        return;
      }

      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    image.onerror = () => reject(new Error('This image could not be opened. Choose a JPEG or PNG image.'));
    image.src = source;
  });
}