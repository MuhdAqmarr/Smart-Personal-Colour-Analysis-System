/**
 * Client-side image validation and preparation for the analysis wizard.
 * The backend independently re-validates everything (magic bytes, decode,
 * bomb guard) — this layer exists for fast, friendly feedback and to shrink
 * uploads before they leave the device.
 */

export const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const MIN_EDGE_PIXELS = 320;
export const MAX_ANALYSIS_EDGE_PIXELS = 1600;

export interface FileValidationResult {
  ok: boolean;
  /** User-facing message when not ok. */
  error?: string;
}

/** Synchronous checks: extension, reported MIME type, size. */
export function validateImageFile(file: File): FileValidationResult {
  const name = file.name.toLowerCase();
  const hasAcceptedExtension = ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
  if (!hasAcceptedExtension) {
    return {
      ok: false,
      error: "Please choose a JPEG, PNG, or WebP image.",
    };
  }
  if (!ACCEPTED_MIME_TYPES.includes(file.type as (typeof ACCEPTED_MIME_TYPES)[number])) {
    return {
      ok: false,
      error: "This file does not look like a supported image (JPEG, PNG, or WebP).",
    };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      ok: false,
      error: `The image is ${sizeMb} MB — the maximum is ${MAX_FILE_SIZE_MB} MB.`,
    };
  }
  if (file.size === 0) {
    return { ok: false, error: "The selected file is empty." };
  }
  return { ok: true };
}

export interface PreparedImage {
  /** JPEG blob, EXIF orientation baked in, longest edge ≤ 1600 px. */
  blob: Blob;
  width: number;
  height: number;
}

/**
 * Decode the file (verifying it is a real image), apply EXIF orientation,
 * and downscale so the longest edge is at most `maxEdge`. Returns a JPEG
 * blob ready for upload. Throws Error with a user-facing message when the
 * file cannot be decoded or is too small.
 */
export async function prepareImageForAnalysis(
  file: File,
  maxEdge: number = MAX_ANALYSIS_EDGE_PIXELS,
): Promise<PreparedImage> {
  let bitmap: ImageBitmap;
  try {
    // "from-image" bakes the EXIF orientation into the bitmap.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("The file could not be read as an image. Try a different photo.");
  }

  try {
    const { width, height } = bitmap;
    if (Math.min(width, height) < MIN_EDGE_PIXELS) {
      throw new Error(
        `The image is too small for reliable analysis — use at least ${MIN_EDGE_PIXELS}px on the shortest side.`,
      );
    }

    const scale = Math.min(1, maxEdge / Math.max(width, height));
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Your browser could not process the image. Try updating it.");
    }
    context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92),
    );
    if (!blob) {
      throw new Error("Your browser could not process the image. Try a different photo.");
    }
    return { blob, width: targetWidth, height: targetHeight };
  } finally {
    bitmap.close();
  }
}

/** Capture a still frame from a playing video element as a JPEG blob. */
export async function captureVideoFrame(video: HTMLVideoElement): Promise<PreparedImage> {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) {
    throw new Error("The camera stream is not ready yet — try again in a moment.");
  }
  const scale = Math.min(1, MAX_ANALYSIS_EDGE_PIXELS / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Your browser could not capture the photo.");
  }
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92),
  );
  if (!blob) {
    throw new Error("Your browser could not capture the photo.");
  }
  return { blob, width: canvas.width, height: canvas.height };
}
