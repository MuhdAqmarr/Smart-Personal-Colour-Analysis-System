import { describe, expect, it } from "vitest";

import { MAX_FILE_SIZE_BYTES, validateImageFile } from "./image-validation";

function makeFile(name: string, type: string, sizeBytes: number): File {
  const blob = new Blob([new Uint8Array(Math.min(sizeBytes, 64))], { type });
  const file = new File([blob], name, { type });
  // File size is derived from content; override for large-size cases.
  Object.defineProperty(file, "size", { value: sizeBytes });
  return file;
}

describe("validateImageFile", () => {
  it("accepts jpeg, png, and webp files within the size limit", () => {
    expect(validateImageFile(makeFile("a.jpg", "image/jpeg", 1024)).ok).toBe(true);
    expect(validateImageFile(makeFile("b.jpeg", "image/jpeg", 1024)).ok).toBe(true);
    expect(validateImageFile(makeFile("c.png", "image/png", 1024)).ok).toBe(true);
    expect(validateImageFile(makeFile("d.webp", "image/webp", 1024)).ok).toBe(true);
  });

  it("rejects unsupported extensions", () => {
    const result = validateImageFile(makeFile("photo.gif", "image/gif", 1024));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/JPEG, PNG, or WebP/);
  });

  it("rejects a mismatched MIME type even with a valid extension", () => {
    const result = validateImageFile(makeFile("payload.jpg", "application/octet-stream", 1024));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/does not look like a supported image/);
  });

  it("rejects files above the 10 MB limit with the size in the message", () => {
    const result = validateImageFile(makeFile("big.jpg", "image/jpeg", MAX_FILE_SIZE_BYTES + 1));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/maximum is 10 MB/);
  });

  it("rejects empty files", () => {
    const result = validateImageFile(makeFile("empty.png", "image/png", 0));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/empty/);
  });

  it("accepts a file at exactly the size limit", () => {
    expect(validateImageFile(makeFile("edge.jpg", "image/jpeg", MAX_FILE_SIZE_BYTES)).ok).toBe(
      true,
    );
  });
});
