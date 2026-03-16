/**
 * Image compression for complaint and work order uploads.
 * Uses react-native-image-resizer to fit within max dimensions and reduce file size.
 */
import ImageResizer from '@bam.tech/react-native-image-resizer';

export const DEFAULT_QUALITY = 80;
export const DEFAULT_MAX_WIDTH = 1920;
export const DEFAULT_MAX_HEIGHT = 1080;

export interface CompressOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * Resize and compress an image file URI for upload.
 * Returns the URI of the compressed file (or the same URI if resizer is not available).
 */
export async function compressImage(
  uri: string,
  options: CompressOptions = {}
): Promise<string> {
  const {
    quality = DEFAULT_QUALITY,
    maxWidth = DEFAULT_MAX_WIDTH,
    maxHeight = DEFAULT_MAX_HEIGHT,
  } = options;

  const result = await ImageResizer.createResizedImage(
    uri,
    maxWidth,
    maxHeight,
    'JPEG',
    quality,
    0,
    undefined,
    false
  );
  return result.uri;
}

/**
 * Validate file size (e.g. max 10MB for API).
 */
export function isValidImageSize(bytes: number, maxBytes: number = 10 * 1024 * 1024): boolean {
  return bytes > 0 && bytes <= maxBytes;
}
