import path from 'node:path';

const PNG_DATA_URL_PREFIX = 'data:image/png;base64,';

export function parsePngDataUrl(imageData: string): Buffer {
  if (typeof imageData !== 'string' || !imageData.startsWith(PNG_DATA_URL_PREFIX)) {
    throw new Error('INVALID_IMAGE_DATA');
  }

  const rawBase64 = imageData.slice(PNG_DATA_URL_PREFIX.length);

  if (!rawBase64 || !/^[A-Za-z0-9+/=]+$/.test(rawBase64)) {
    throw new Error('INVALID_BASE64');
  }

  return Buffer.from(rawBase64, 'base64');
}

export function createSafePhotoFilename(date = new Date()): string {
  const stamp = date.toISOString().replace(/[:.]/g, '-');
  return `childrens-day-photo-${stamp}.png`;
}

export function resolveUploadPath(uploadDir: string, filename: string): string {
  const normalized = path.basename(filename);
  return path.join(uploadDir, normalized);
}
