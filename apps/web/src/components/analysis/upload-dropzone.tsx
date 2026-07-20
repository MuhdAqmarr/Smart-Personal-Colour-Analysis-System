"use client";

import { ImageUp } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  ACCEPTED_EXTENSIONS,
  MAX_FILE_SIZE_MB,
  prepareImageForAnalysis,
  validateImageFile,
  type PreparedImage,
} from "@/lib/image-validation";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  onSelect: (image: PreparedImage) => void;
}

export function UploadDropzone({ onSelect }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined | null) {
    setError(null);
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.ok) {
      setError(validation.error ?? "This file cannot be used.");
      return;
    }

    setProcessing(true);
    try {
      const prepared = await prepareImageForAnalysis(file);
      onSelect(prepared);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The image could not be processed.");
    } finally {
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a photo: press Enter to browse files, or drag an image here"
        aria-describedby="upload-requirements"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void handleFile(event.dataTransfer.files?.[0]);
        }}
        className={cn(
          "focus-visible:ring-ring/50 focus-visible:border-ring focus-visible:ring-3 duration-(--motion-fast) flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center outline-none transition-colors",
          dragging
            ? "border-ring bg-accent/50"
            : "border-border hover:border-border-strong hover:bg-surface",
        )}
      >
        {processing ? (
          <>
            <Spinner className="size-6" />
            <p className="text-muted-foreground text-sm">Preparing image…</p>
          </>
        ) : (
          <>
            <span className="bg-secondary text-foreground flex size-12 items-center justify-center rounded-xl">
              <ImageUp className="size-6" aria-hidden="true" />
            </span>
            <div>
              <p className="font-medium">Drag a photo here or browse</p>
              <p id="upload-requirements" className="text-muted-foreground mt-1 text-xs">
                JPEG, PNG, or WebP · up to {MAX_FILE_SIZE_MB} MB
              </p>
            </div>
            <Button variant="outline" size="sm" tabIndex={-1}>
              Choose a file
            </Button>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(",")}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />

      {error ? (
        <p role="alert" className="text-destructive text-sm font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}
