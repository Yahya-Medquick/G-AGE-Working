import React, { useRef, useState } from 'react';
import ReactCrop, { type PixelCrop, type PercentCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropModalProps {
  src: string;
  onUseCrop: (crop: PixelCrop) => void;
  onUseFullImage: () => void;
  onCancel: () => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  src,
  onUseCrop,
  onUseFullImage,
  onCancel,
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<PercentCrop>();

  const handleUseCrop = () => {
    const image = imageRef.current;
    if (!image || !crop || crop.width <= 0 || crop.height <= 0) return;
    onUseCrop({
      unit: 'px',
      x: (crop.x / 100) * image.naturalWidth,
      y: (crop.y / 100) * image.naturalHeight,
      width: (crop.width / 100) * image.naturalWidth,
      height: (crop.height / 100) * image.naturalHeight,
    });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-3" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-crop-title"
        className="w-full max-w-2xl rounded-xl bg-white p-4 shadow-2xl dark:bg-slate-900"
      >
        <h2 id="image-crop-title" className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Crop image</h2>
        <div className="flex max-h-[68vh] justify-center overflow-auto rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
          <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)}>
            <img ref={imageRef} src={src} alt="Select an image crop" className="block max-h-[64vh] max-w-full object-contain" />
          </ReactCrop>
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button type="button" onClick={onUseFullImage} className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Use full image
          </button>
          <button type="button" onClick={handleUseCrop} disabled={!crop || crop.width <= 0 || crop.height <= 0} className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40">
            Use crop
          </button>
        </div>
      </section>
    </div>
  );
};