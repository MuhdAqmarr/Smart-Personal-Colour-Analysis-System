"use client";

import { CaptureStep } from "@/components/analysis/steps/capture-step";
import { ConsentStep } from "@/components/analysis/steps/consent-step";
import { GuidanceStep } from "@/components/analysis/steps/guidance-step";
import { PreviewStep } from "@/components/analysis/steps/preview-step";
import { ProcessingStep } from "@/components/analysis/steps/processing-step";
import { ResultsStep } from "@/components/analysis/steps/results-step";
import { useWizard, WizardProvider, type WizardStep } from "@/components/analysis/wizard-context";
import { cn } from "@/lib/utils";

const STEP_LABELS: { step: WizardStep; label: string }[] = [
  { step: "consent", label: "Consent" },
  { step: "guidance", label: "Guidance" },
  { step: "capture", label: "Photo" },
  { step: "preview", label: "Preview" },
  { step: "processing", label: "Analysis" },
  { step: "results", label: "Results" },
];

function StepIndicator() {
  const { step } = useWizard();
  const currentIndex = STEP_LABELS.findIndex((item) => item.step === step);

  return (
    <ol
      aria-label={`Analysis progress: step ${currentIndex + 1} of ${STEP_LABELS.length}`}
      className="mb-8 flex items-center justify-between gap-1"
    >
      {STEP_LABELS.map((item, index) => {
        const state =
          index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming";
        return (
          <li key={item.step} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              aria-hidden="true"
              className={cn(
                "h-1.5 w-full rounded-full transition-colors",
                state === "done" && "bg-primary",
                state === "current" && "bg-primary/60",
                state === "upcoming" && "bg-border",
              )}
            />
            <span
              aria-current={state === "current" ? "step" : undefined}
              className={cn(
                "text-[11px] font-medium",
                state === "current" ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {item.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function WizardBody() {
  const { step } = useWizard();
  switch (step) {
    case "consent":
      return <ConsentStep />;
    case "guidance":
      return <GuidanceStep />;
    case "capture":
      return <CaptureStep />;
    case "preview":
      return <PreviewStep />;
    case "processing":
      return <ProcessingStep />;
    case "results":
      return <ResultsStep />;
  }
}

export function AnalysisWizard() {
  return (
    <WizardProvider>
      <div className="bg-card shadow-xs rounded-2xl border p-5 sm:p-8">
        <StepIndicator />
        <WizardBody />
      </div>
    </WizardProvider>
  );
}
