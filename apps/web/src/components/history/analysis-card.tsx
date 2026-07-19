"use client";

import { Camera, Trash2 } from "lucide-react";
import Link from "next/link";

import type { AnalysisSummary } from "@/lib/api/analyses";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function titleCase(slug: string | null): string {
  if (!slug) return "";
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

interface AnalysisCardProps {
  analysis: AnalysisSummary;
  onDelete: (id: string) => void;
  deleting?: boolean;
}

export function AnalysisCard({ analysis, onDelete, deleting = false }: AnalysisCardProps) {
  const headline = titleCase(analysis.subseasonSlug ?? analysis.seasonSlug);

  return (
    <Card variant="interactive">
      <CardContent className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="size-12 shrink-0 rounded-xl shadow-[inset_0_0_0_1px_oklch(0.2_0.01_260/10%)]"
          style={{ backgroundColor: analysis.combinedHex ?? "#d4c5b5" }}
        />
        <div className="min-w-0 flex-1">
          <Link
            href={`/history/${analysis.id}`}
            className="focus-visible:ring-ring/50 focus-visible:ring-3 rounded font-semibold tracking-[-0.01em] underline-offset-4 outline-none hover:underline"
          >
            {headline}
          </Link>
          <p className="text-muted-foreground mt-0.5 text-sm capitalize">
            {analysis.undertone} undertone · {formatDate(analysis.createdAt)}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="capitalize">
              {analysis.confidenceLabel} · {(analysis.confidence * 100).toFixed(0)}%
            </Badge>
            {analysis.hasImage ? (
              <Badge variant="secondary" className="gap-1">
                <Camera className="size-3" aria-hidden="true" />
                Photo saved
              </Badge>
            ) : null}
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete analysis from ${formatDate(analysis.createdAt)}`}
                disabled={deleting}
              />
            }
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this analysis?</AlertDialogTitle>
              <AlertDialogDescription>
                The result, its colour measurements
                {analysis.hasImage ? ", and the saved photo" : ""} will be permanently removed. This
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(analysis.id)}>
                Delete permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
