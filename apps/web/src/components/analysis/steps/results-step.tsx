"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Camera, CheckCircle2, History, LogIn, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { useWizard } from "@/components/analysis/wizard-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaletteView } from "@/components/palette/palette-view";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import { saveAnalysisImage } from "@/lib/api/analyses";
import { ApiError } from "@/lib/api/client";
import { getSeasonDetail } from "@/lib/api/palettes";

const CONFIDENCE_STYLE: Record<string, string> = {
  high: "bg-success/10 text-success",
  medium: "bg-warning/10 text-warning",
  low: "bg-secondary text-secondary-foreground",
};

const SEASON_TINT: Record<string, string> = {
  spring: "var(--season-spring)",
  summer: "var(--season-summer)",
  autumn: "var(--season-autumn)",
  winter: "var(--season-winter)",
};

/**
 * In-wizard result summary with save actions. The full tabbed experience
 * (fashion palette, cosmetics, products) lives on the analysis detail and
 * palette screens as those phases land.
 */
export function ResultsStep() {
  const { result, image, consent, reset } = useWizard();
  const { session, configured } = useSession();

  const saveImage = useMutation({
    mutationFn: () => {
      if (!result?.analysisId || !image) throw new Error("Nothing to save.");
      return saveAnalysisImage(result.analysisId, image.blob);
    },
    onSuccess: () => toast.success("Photo saved to your private storage"),
    onError: (error) =>
      toast.error("Could not save the photo", {
        description: error instanceof ApiError ? error.message : undefined,
      }),
  });

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
      <div
        className="wash-season ring-border rounded-3xl px-6 py-10 text-center ring-1"
        style={{ "--season-tint": SEASON_TINT[seasonName] } as React.CSSProperties}
      >
        <p className="text-eyebrow text-muted-foreground">Estimated undertone &amp; season</p>
        <h2 className="text-title-1 mt-3 capitalize">
          {result.undertone.undertone} · {subSeason ? subSeason.replace(/-/g, " ") : seasonName}
        </h2>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Badge className={CONFIDENCE_STYLE[result.confidenceLabel] ?? ""}>
            {result.confidenceLabel} confidence · {(result.confidence * 100).toFixed(0)}%
          </Badge>
          <Badge variant="outline" className="bg-card/60">
            Quality {result.quality.overallScore.toFixed(0)}/100
          </Badge>
        </div>
        <p className="text-muted-foreground mx-auto mt-4 max-w-md text-sm leading-relaxed">
          {result.explanation.summary}
        </p>
      </div>

      <Card variant="tinted">
        <CardHeader>
          <CardTitle className="text-base">Why this result</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-muted-foreground list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
            {result.explanation.evidence.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Save state ---------------------------------------------------- */}
      {result.persisted && result.analysisId ? (
        <Card className="ring-success/30">
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="text-success size-4" aria-hidden="true" />
              Saved to your history
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                render={<Link href={`/history/${result.analysisId}`} />}
              >
                <History aria-hidden="true" data-icon="inline-start" />
                View details
              </Button>
              {consent.saveImage ? (
                <p className="text-muted-foreground self-center text-xs">Photo stored ✓</p>
              ) : image ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => saveImage.mutate()}
                  disabled={saveImage.isPending || saveImage.isSuccess}
                >
                  <Camera aria-hidden="true" data-icon="inline-start" />
                  {saveImage.isSuccess ? "Photo saved" : "Also save my photo"}
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : configured && !session ? (
        <Card variant="plain" className="border-border border border-dashed">
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted-foreground text-sm">
              This guest result is not stored anywhere. Create an account to keep your analyses.
            </p>
            <Button variant="outline" size="sm" render={<Link href="/register" />}>
              <LogIn aria-hidden="true" data-icon="inline-start" />
              Sign up to save
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <PaletteSection season={seasonName} subSeason={subSeason} interactive={Boolean(session)} />

      <div className="flex flex-wrap justify-center gap-3 print:hidden">
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

function PaletteSection({
  season,
  subSeason,
  interactive,
}: {
  season: string;
  subSeason: string | null;
  interactive: boolean;
}) {
  const palette = useQuery({
    queryKey: ["season-palette", season, subSeason],
    queryFn: () => getSeasonDetail(season, subSeason),
  });

  if (palette.isPending) {
    return (
      <div className="space-y-3" aria-label="Loading palette">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }
  if (palette.isError) {
    return (
      <p className="text-muted-foreground text-center text-sm">
        The palette could not be loaded right now — your result above is unaffected.
      </p>
    );
  }
  return (
    <section aria-label="Your fashion and cosmetic palette" className="border-t pt-6">
      <h3 className="mb-4 text-xl font-semibold tracking-tight">Your colours to explore</h3>
      <PaletteView
        palette={palette.data}
        interactive={interactive}
        invalidateKeys={[["season-palette", season, subSeason]]}
      />
    </section>
  );
}
