"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ScanFace } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { AnalysisCard } from "@/components/history/analysis-card";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteAnalysis, listAnalyses } from "@/lib/api/analyses";
import { ApiError } from "@/lib/api/client";

export default function HistoryPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["analyses", page],
    queryFn: () => listAnalyses(page),
  });

  const removal = useMutation({
    mutationFn: deleteAnalysis,
    onSuccess: () => {
      toast.success("Analysis deleted");
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
    },
    onError: (error) =>
      toast.error("Could not delete", {
        description: error instanceof ApiError ? error.message : undefined,
      }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Saved analyses</h1>
          <p className="text-muted-foreground mt-1">
            Every saved result, newest first. Deleting is immediate and permanent.
          </p>
        </div>
        <Button render={<Link href="/analysis" />}>New analysis</Button>
      </div>

      {query.isPending ? (
        <div className="space-y-3" aria-label="Loading analyses">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : query.isError ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Could not load your history</EmptyTitle>
            <EmptyDescription>
              {query.error instanceof ApiError
                ? query.error.message
                : "Something went wrong while loading."}
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={() => query.refetch()}>
            Try again
          </Button>
        </Empty>
      ) : query.data.items.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ScanFace aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No saved analyses yet</EmptyTitle>
            <EmptyDescription>
              Run an analysis while signed in and it will be saved here automatically.
            </EmptyDescription>
          </EmptyHeader>
          <Button render={<Link href="/analysis" />}>Start your first analysis</Button>
        </Empty>
      ) : (
        <>
          <ul className="space-y-3">
            {query.data.items.map((analysis) => (
              <li key={analysis.id}>
                <AnalysisCard
                  analysis={analysis}
                  onDelete={(id) => removal.mutate(id)}
                  deleting={removal.isPending}
                />
              </li>
            ))}
          </ul>
          {query.data.pagination.totalPages > 1 ? (
            <nav className="flex items-center justify-center gap-3" aria-label="Pagination">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </Button>
              <span className="text-muted-foreground text-sm">
                Page {page} of {query.data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= query.data.pagination.totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
