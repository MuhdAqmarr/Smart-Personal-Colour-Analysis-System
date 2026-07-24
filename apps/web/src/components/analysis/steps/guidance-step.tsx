"use client";

import { CheckCircle2, XCircle } from "lucide-react";

import { useWizard } from "@/components/analysis/wizard-context";
import { WizardNav } from "@/components/analysis/wizard-nav";

const doTips = [
  "Face the camera directly, eyes level",
  "Use natural daylight — near a window is ideal",
  "Keep your forehead and cheeks visible",
  "Use a neutral background",
  "Keep your face close enough to fill the guide",
  "Be the only person in the frame",
];

const avoidTips = [
  "Yellow, warm-white, or coloured lighting",
  "Strong makeup — especially foundation and blusher",
  "Beauty filters or edited photos",
  "Tinted or coloured glasses",
  "Deep shadows across the face",
  "Overexposed, washed-out light",
];

export function GuidanceStep() {
  const { go } = useWizard();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[1.4rem] font-semibold tracking-[-0.015em]">
          Getting a reliable photo
        </h2>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          Good lighting matters most. A little setup now gives a more reliable result.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <section
          aria-labelledby="tips-do"
          className="bg-surface ring-border rounded-xl p-4 ring-1 sm:p-5"
        >
          <h3 id="tips-do" className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="text-success size-4" aria-hidden="true" />
            Aim for
          </h3>
          <ul className="text-muted-foreground space-y-2 text-sm leading-relaxed">
            {doTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="tips-avoid"
          className="bg-surface ring-border rounded-xl p-4 ring-1 sm:p-5"
        >
          <h3 id="tips-avoid" className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <XCircle className="text-destructive size-4" aria-hidden="true" />
            Avoid
          </h3>
          <ul className="text-muted-foreground space-y-2 text-sm leading-relaxed">
            {avoidTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>
      </div>

      <p className="text-muted-foreground text-sm">
        We&apos;ll check your photo next — but good light now saves a retake.
      </p>

      <WizardNav onBack={() => go("consent")} onContinue={() => go("capture")} />
    </div>
  );
}
