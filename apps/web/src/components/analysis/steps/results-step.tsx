"use client";

import { RefreshCcw } from "lucide-react";

import { useWizard } from "@/components/analysis/wizard-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const CONFIDENCE_STYLE: Record<string, string> = {
  high: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  medium: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  low: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
};

/**
 * Compact in-wizard result summary. The full tabbed results experience
 * (fashion / cosmetics / products / technical details) is delivered by the
 * results phase and linked from here once available.
 */
export function ResultsStep() {
  const { result, reset } = useWizard();

  if (!result) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground">No analysis result available.</p>
        <Button onClick={reset}>Start again</Button>
      </div>
    );
  }

  const seasonName = result.season.season;
  const subSeason = result.season.subSeason;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-muted-foreground text-sm">Estimated undertone</p>
        <h2 className="font-heading mt-1 text-3xl font-semibold capitalize tracking-tight">
          {result.undertone.undertone} · {subSeason ? subSeason.replace(/-/g, " ") : seasonName}
        </h2>
        <div className="mt-3 flex items-center justify-center gap-2">
          <Badge className={CONFIDENCE_STYLE[result.confidenceLabel] ?? ""}>
            {result.confidenceLabel} confidence · {(result.confidence * 100).toFixed(0)}%
          </Badge>
          <Badge variant="outline">Quality {result.quality.overallScore.toFixed(0)}/100</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Why this result</CardTitle>
          <CardDescription>{result.explanation.summary}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-muted-foreground list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
            {result.explanation.evidence.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="outline" onClick={reset}>
          <RefreshCcw aria-hidden="true" data-icon="inline-start" />
          Analyse another photo
        </Button>
      </div>

      <p className="text-muted-foreground text-center text-xs leading-relaxed">
        Results are styling estimates from a rule-based engine and vary with lighting and camera
        conditions. Classifier v{result.classifierVersion}.
      </p>
    </div>
  );
}
