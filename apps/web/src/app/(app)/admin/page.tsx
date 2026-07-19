"use client";

import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminStats, listAlgorithmVersions, listAuditLogs } from "@/lib/api/admin";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-card rounded-xl border p-4">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: getAdminStats });
  const versions = useQuery({
    queryKey: ["admin-versions"],
    queryFn: listAlgorithmVersions,
  });
  const audit = useQuery({ queryKey: ["admin-audit", 1], queryFn: () => listAuditLogs(1) });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title-2">Admin dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Anonymised usage aggregates and system health. Individual analyses and user images are
          never accessible here.
        </p>
      </div>

      {stats.isPending ? (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : stats.isError ? (
        <p className="text-muted-foreground">Statistics could not be loaded.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <Stat label="Registered users" value={stats.data.totalUsers} />
            <Stat label="Total analyses" value={stats.data.totalAnalyses} />
            <Stat label="Analyses (7 days)" value={stats.data.analysesLast7Days} />
            <Stat
              label="Average confidence"
              value={
                stats.data.averageConfidence != null
                  ? `${(Number(stats.data.averageConfidence) * 100).toFixed(0)}%`
                  : "—"
              }
            />
            <Stat
              label="Avg processing"
              value={
                stats.data.averageProcessingMs != null
                  ? `${Number(stats.data.averageProcessingMs).toFixed(0)} ms`
                  : "—"
              }
            />
            <Stat label="Active products" value={stats.data.activeProducts} />
            <Stat label="Active stores" value={stats.data.activeStores} />
            <Stat label="Palette colours" value={stats.data.paletteColours} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Season distribution</CardTitle>
                <CardDescription>Share of saved analyses per suggested season.</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(stats.data.seasonDistribution).length === 0 ? (
                  <p className="text-muted-foreground text-sm">No analyses recorded yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {Object.entries(stats.data.seasonDistribution).map(([season, count]) => {
                      const total = stats.data.totalAnalyses || 1;
                      const share = (count / total) * 100;
                      return (
                        <li key={season} className="flex items-center gap-3">
                          <span className="w-16 text-sm capitalize">{season}</span>
                          <div className="bg-muted h-2.5 flex-1 overflow-hidden rounded-full">
                            <div
                              className="bg-primary h-full rounded-full"
                              style={{ width: `${share}%` }}
                            />
                          </div>
                          <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">
                            {count}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="flex items-center justify-between">
                  <span className="text-muted-foreground">Active classifier</span>
                  <Badge variant="outline">v{stats.data.classifierVersion ?? "?"}</Badge>
                </p>
                {versions.isSuccess
                  ? versions.data.map((version) => (
                      <p key={version.id} className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          {version.name} v{version.version}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {version.isActive ? "active" : "inactive"} ·{" "}
                          {new Date(version.releasedAt).toLocaleDateString()}
                        </span>
                      </p>
                    ))
                  : null}
                <p className="flex items-center justify-between">
                  <span className="text-muted-foreground">Confidence mix</span>
                  <span className="text-xs tabular-nums">
                    {["high", "medium", "low"]
                      .map((label) => `${label} ${stats.data.confidenceDistribution[label] ?? 0}`)
                      .join(" · ")}
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent admin activity</CardTitle>
        </CardHeader>
        <CardContent>
          {audit.isPending ? (
            <Skeleton className="h-24 w-full" />
          ) : audit.isError || audit.data.length === 0 ? (
            <p className="text-muted-foreground text-sm">No audit entries yet.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {audit.data.slice(0, 8).map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-3">
                  <span className="truncate">
                    <span className="font-medium">{entry.action}</span>{" "}
                    <span className="text-muted-foreground">
                      {entry.entityType} {entry.entityId.slice(0, 8)}
                    </span>
                  </span>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
