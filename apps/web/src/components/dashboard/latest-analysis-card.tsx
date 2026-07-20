"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ScanFace } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listAnalyses } from "@/lib/api/analyses";

function titleCase(slug: string | null): string {
  if (!slug) return "";
  return slug
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** The signed-in user's most recent result, or a first-run prompt. */
export function LatestAnalysisCard() {
  const query = useQuery({
    queryKey: ["analyses", "latest"],
    queryFn: () => listAnalyses(1, 1),
  });

  if (query.isPending) {
    return <Skeleton className="h-40 w-full rounded-xl" aria-label="Loading latest analysis" />;
  }

  const latest = query.data?.items?.[0];

  if (query.isError || !latest) {
    return (
      <Card variant="tinted" className="h-full">
        <CardHeader>
          <CardTitle className="text-base">No analyses yet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your saved results will appear here. Run your first analysis to find your season.
          </p>
          <Button render={<Link href="/analysis" />}>
            <ScanFace aria-hidden="true" data-icon="inline-start" />
            Start your first analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  const headline = titleCase(latest.subseasonSlug ?? latest.seasonSlug);

  return (
    <div
      className="wash-season ring-border flex h-full flex-col justify-between rounded-xl p-5 ring-1"
      style={
        {
          "--season-tint": `var(--season-${latest.seasonSlug}, var(--accent))`,
        } as React.CSSProperties
      }
    >
      <div>
        <p className="text-eyebrow text-muted-foreground">Latest result</p>
        <p className="mt-2 flex items-center gap-2.5 text-xl font-semibold tracking-[-0.01em]">
          {latest.combinedHex ? (
            <span
              aria-hidden="true"
              className="inline-block size-5 rounded-full shadow-[inset_0_0_0_1px_oklch(0.2_0.01_260/15%)]"
              style={{ backgroundColor: latest.combinedHex }}
            />
          ) : null}
          {headline}
        </p>
        <p className="text-muted-foreground mt-1 text-sm capitalize">
          {latest.undertone} undertone · {latest.confidenceLabel} confidence ·{" "}
          {new Date(latest.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className="mt-4">
        <Button
          variant="outline"
          size="sm"
          className="bg-card/70"
          render={<Link href={`/history/${latest.id}`} />}
        >
          View full result
          <ArrowRight aria-hidden="true" data-icon="inline-end" />
        </Button>
      </div>
    </div>
  );
}
