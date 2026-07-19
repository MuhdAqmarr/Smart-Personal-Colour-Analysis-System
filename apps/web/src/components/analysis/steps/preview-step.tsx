"use client";

import { ArrowRight, RefreshCcw } from "lucide-react";

import { useWizard } from "@/components/analysis/wizard-context";
import { Button } from "@/components/ui/button";

export function PreviewStep() {
  const { imageUrl, image, source, clearImage, go } = useWizard();

  if (!imageUrl || !image) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground">No photo selected yet.</p>
        <Button onClick={() => go("capture")}>Back to camera / upload</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Happy with this photo?
        </h2>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          Check that your face is well lit, sharp, and free of shadows before analysing.
        </p>
      </div>

      <figure className="mx-auto max-w-sm">
        {/* Blob object URL preview; next/image cannot optimise blob URLs. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Preview of the photo selected for analysis"
          width={image.width}
          height={image.height}
          className="w-full rounded-xl border object-contain"
        />
        <figcaption className="text-muted-foreground mt-2 text-center text-xs">
          {source === "camera" ? "Captured with camera" : "Uploaded photo"} · {image.width}×
          {image.height}px · processed at up to 1600px
        </figcaption>
      </figure>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="outline" onClick={clearImage}>
          <RefreshCcw aria-hidden="true" data-icon="inline-start" />
          Retake / choose another
        </Button>
        <Button size="lg" onClick={() => go("processing")}>
          Analyse this photo
          <ArrowRight aria-hidden="true" data-icon="inline-end" />
        </Button>
      </div>

      <p className="text-muted-foreground text-center text-xs">
        The photo is sent once for analysis and is not stored unless you chose to save it.
      </p>
    </div>
  );
}
