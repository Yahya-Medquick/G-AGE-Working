import { describe, expect, it } from 'vitest';
import { getResizedDimensions, MAX_IMAGE_UPLOAD_BYTES, validateImageFile } from '../src/utils/imageProcessing';

describe('image processing', () => {
  it('preserves aspect ratio while limiting the longest side to 1600 pixels', () => {
    expect(getResizedDimensions(4000, 3000)).toEqual({ width: 1600, height: 1200 });
    expect(getResizedDimensions(800, 1200)).toEqual({ width: 800, height: 1200 });
  });

  it('rejects non-images and source files larger than 20 MB', () => {
    expect(validateImageFile({ type: 'text/plain', size: 20 })).toMatch(/image file/i);
    expect(validateImageFile({ type: 'image/jpeg', size: MAX_IMAGE_UPLOAD_BYTES + 1 })).toMatch(/20 MB/i);
    expect(validateImageFile({ type: 'image/png', size: MAX_IMAGE_UPLOAD_BYTES })).toBeNull();
  });
});