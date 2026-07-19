import type { Metadata } from "next";

import { AnalysisWizard } from "@/components/analysis/analysis-wizard";

export const metadata: Metadata = {
  title: "Colour analysis",
  description:
    "Capture or upload a facial photo and receive an estimated undertone, colour season, and personal palettes.",
};

export default function AnalysisPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="sr-only">Personal colour analysis</h1>
      <AnalysisWizard />
    </div>
  );
}
