import { describe, it, expect } from 'vitest';
import { isAcceptedImage } from '@/utils/fileValidation';

// Minimal File-like stub (only the fields the validator reads).
const f = (name: string, type = ''): File => ({ name, type }) as unknown as File;

describe('isAcceptedImage', () => {
  it('accepts common raster/vector extensions regardless of case, even with no MIME type', () => {
    for (const ext of ['.jpg', '.JPG', '.jpeg', '.png', '.webp', '.gif', '.avif', '.bmp', '.svg']) {
      expect(isAcceptedImage(f(`photo${ext}`))).toBe(true);
    }
  });

  it('accepts anything the browser reports as image/*, even with an unlisted extension', () => {
    expect(isAcceptedImage(f('photo.heic', 'image/heic'))).toBe(true);
  });

  it('rejects a non-image extension with no MIME type', () => {
    expect(isAcceptedImage(f('notes.txt'))).toBe(false);
    expect(isAcceptedImage(f('archive.zip'))).toBe(false);
  });

  it('rejects a file with no extension and no MIME type', () => {
    expect(isAcceptedImage(f('README'))).toBe(false);
  });
});
