"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Consistent Back / Continue footer for every wizard step, so users always
 * know how to move back or forward. Pass only the directions a step supports
 * — the layout keeps Continue right-aligned even when Back is absent.
 */
export function WizardNav({
  onBack,
  backLabel = "Back",
  onContinue,
  continueLabel = "Continue",
  continueDisabled = false,
  className,
}: {
  onBack?: () => void;
  backLabel?: string;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-separator mt-2 flex items-center justify-between gap-3 border-t pt-5",
        className,
      )}
    >
      {onBack ? (
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft aria-hidden="true" data-icon="inline-start" />
          {backLabel}
        </Button>
      ) : (
        <span />
      )}
      {onContinue ? (
        <Button size="lg" onClick={onContinue} disabled={continueDisabled}>
          {continueLabel}
          <ArrowRight aria-hidden="true" data-icon="inline-end" />
        </Button>
      ) : null}
    </div>
  );
}
