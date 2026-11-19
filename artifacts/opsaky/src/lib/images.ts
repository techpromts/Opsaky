const MAX_FILE_SIZE = 15 * 1024 * 1024;
export const MAX_IMAGE_DATA_URL_LENGTH = 249_999;
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export type ImageCompressionOptions = {
  maxWidth: number;
  maxHeight?: number;
};

export function isSupportedImageType(type: string): boolean {
  return SUPPORTED_IMAGE_TYPES.has(type.toLowerCase());
}

function encode(canvas: HTMLCanvasElement, mimeType: string, quality: number): string {
  // Some browsers silently return PNG when they do not support the requested encoder.
  const dataUrl = canvas.toDataURL(mimeType, quality);
  if (!dataUrl.startsWith(`data:${mimeType};base64,`)) {
    throw new Error(`${mimeType} encoding is not supported by this browser.`);
  }
  return dataUrl;
}

export async function compressImage(
  file: File,
  { maxWidth, maxHeight = maxWidth }: ImageCompressionOptions,
): Promise<string> {
  if (!isSupportedImageType(file.type)) {
    throw new Error("Choose a JPEG, PNG, WebP, or AVIF image.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Choose an image smaller than 15 MB.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("This image could not be opened. Try a JPEG, PNG, or WebP file.");
  }

  try {
    const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
    let width = Math.max(1, Math.round(bitmap.width * scale));
    let height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser could not prepare this image.");

    const drawAndEncode = (mimeType: string, quality: number) => {
      ctx.clearRect(0, 0, width, height);
      // JPEG has no alpha channel; use a white background for transparent logos.
      if (mimeType === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
      }
      ctx.drawImage(bitmap, 0, 0, width, height);
      return encode(canvas, mimeType, quality);
    };

    // Keep 0.8 quality by shrinking within the requested maximum dimensions first.
    for (let sizeAttempt = 0; sizeAttempt < 9; sizeAttempt++) {
      canvas.width = width;
      canvas.height = height;

      for (const mimeType of ["image/webp", "image/jpeg"]) {
        let dataUrl: string;
        try {
          dataUrl = drawAndEncode(mimeType, 0.8);
        } catch {
          continue;
        }
        if (dataUrl.length <= MAX_IMAGE_DATA_URL_LENGTH) return dataUrl;
      }

      if (sizeAttempt < 8) {
        width = Math.max(1, Math.floor(width * 0.82));
        height = Math.max(1, Math.floor(height * 0.82));
      }
    }

    // Some highly detailed images still need lower quality after resizing.
    canvas.width = width;
    canvas.height = height;
    for (const mimeType of ["image/webp", "image/jpeg"]) {
      for (const quality of [0.75, 0.7, 0.65, 0.6, 0.55, 0.5]) {
        let dataUrl: string;
        try {
          dataUrl = drawAndEncode(mimeType, quality);
        } catch {
          break;
        }
        if (dataUrl.length <= MAX_IMAGE_DATA_URL_LENGTH) return dataUrl;
      }
    }
    throw new Error("This image is too detailed to fit the 250 KB upload limit. Try a smaller image.");
  } finally {
    bitmap.close();
  }
}
