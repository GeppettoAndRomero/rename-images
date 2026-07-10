/** Accept-list for rename-images: common raster/vector image types a browser can preview inline. */
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.bmp', '.svg'];
const ALLOWED_MIME_PREFIX = 'image/';

export function isAcceptedImage(file: File): boolean {
  if (file.type && file.type.startsWith(ALLOWED_MIME_PREFIX)) return true;
  const dot = file.name.lastIndexOf('.');
  if (dot < 0) return false;
  return ALLOWED_EXTENSIONS.includes(file.name.slice(dot).toLowerCase());
}
