"use client";

import { useWizard } from "@/components/analysis/wizard-context";
import { WizardNav } from "@/components/analysis/wizard-nav";
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
        <h2 className="text-[1.4rem] font-semibold tracking-[-0.015em]">Happy with this photo?</h2>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          Make sure your face is clear, sharp, and well lit.
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
          className="ring-border w-full rounded-2xl object-contain ring-1"
        />
        <figcaption className="text-muted-foreground mt-2 text-center text-xs">
          {source === "camera" ? "Captured with camera" : "Uploaded photo"} · {image.width}×
          {image.height}px · processed at up to 1600px
        </figcaption>
      </figure>

      <p className="text-muted-foreground text-center text-xs">
        Your photo is analysed once and not stored unless you chose to save it.
      </p>

      <WizardNav
        onBack={clearImage}
        backLabel="Back"
        onContinue={() => go("processing")}
        continueLabel="Analyse this photo"
      />
    </div>
  );
}
