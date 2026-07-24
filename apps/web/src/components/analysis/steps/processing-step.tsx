"use client";

import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { useEffect } from "react";

import { useWizard } from "@/components/analysis/wizard-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api/client";
import { runAnalysis } from "@/lib/api/analyses";

/** Error codes that mean "the photo needs fixing", not "the service broke". */
const RETAKE_CODES = new Set([
  "NO_FACE_DETECTED",
  "MULTIPLE_FACES_DETECTED",
  "FACE_TOO_SMALL",
  "FACE_OUT_OF_FRAME",
  "LANDMARKS_UNAVAILABLE",
  "POSE_TOO_EXTREME",
  "IMAGE_TOO_BLURRY",
  "IMAGE_TOO_DARK",
  "IMAGE_TOO_BRIGHT",
  "UNEVEN_LIGHTING",
  "STRONG_COLOUR_CAST",
  "QUALITY_TOO_LOW",
  "IMAGE_DECODE_FAILED",
  "IMAGE_TOO_SMALL",
]);

export function ProcessingStep() {
  const { image, consent, setResult, clearImage, go } = useWizard();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!image) throw new Error("No image selected.");
      return runAnalysis(image.blob, { saveImage: consent.saveImage });
    },
    onSuccess: (result) => {
      setResult(result);
      go("results");
    },
  });

  // Start when this observer is idle. Guarding on `isIdle` (instead of a
  // ref) keeps this correct under React StrictMode's double-invocation:
  // a mutation fired on a discarded observer never updates the live one,
  // which would otherwise sit on the spinner forever.
  useEffect(() => {
    if (mutation.isIdle) {
      mutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (mutation.isError) {
    const error = mutation.error;
    const isApiError = error instanceof ApiError;
    const isRetakeProblem = isApiError && RETAKE_CODES.has(error.code);

    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle aria-hidden="true" />
          <AlertTitle>
            {isRetakeProblem ? "This photo cannot be analysed reliably" : "Analysis failed"}
          </AlertTitle>
          <AlertDescription>
            <p>{error instanceof Error ? error.message : "Something went wrong."}</p>
            {isApiError && error.details ? (
              <ul className="mt-2 list-disc pl-5 text-sm">
                {Object.entries(error.details)
                  .filter(([key]) => key === "retakeTips")
                  .flatMap(([, tips]) => (Array.isArray(tips) ? tips : []))
                  .map((tip) => (
                    <li key={String(tip)}>{String(tip)}</li>
                  ))}
              </ul>
            ) : null}
          </AlertDescription>
        </Alert>

        <div className="flex flex-wrap justify-center gap-3">
          {isRetakeProblem ? (
            <Button onClick={clearImage}>
              <RefreshCcw aria-hidden="true" data-icon="inline-start" />
              Retake photo
            </Button>
          ) : (
            <>
              <Button onClick={() => mutation.mutate()}>Try again</Button>
              <Button variant="outline" onClick={() => go("preview")}>
                Back to preview
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center" role="status">
      <Spinner className="size-8" />
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-[-0.01em]">Analysing your photo…</h2>
        <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
          Reading the colours in your photo. This takes a few seconds.
        </p>
      </div>
      <Progress value={null} className="max-w-xs" aria-label="Analysis in progress" />
    </div>
  );
}
