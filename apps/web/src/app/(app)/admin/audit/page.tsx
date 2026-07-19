"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listAuditLogs } from "@/lib/api/admin";

export default function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const logs = useQuery({
    queryKey: ["admin-audit", page],
    queryFn: () => listAuditLogs(page),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-title-3">Audit log</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Append-only record of administrative changes. Entries can never be edited or removed from
          this interface.
        </p>
      </div>

      {logs.isPending ? (
        <Skeleton className="h-72 w-full rounded-xl" />
      ) : logs.isError ? (
        <p className="text-muted-foreground">Audit log could not be loaded.</p>
      ) : logs.data.length === 0 ? (
        <p className="text-muted-foreground text-sm">No entries yet.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left text-xs">
                  <th scope="col" className="p-3 font-medium">
                    When
                  </th>
                  <th scope="col" className="p-3 font-medium">
                    Action
                  </th>
                  <th scope="col" className="p-3 font-medium">
                    Entity
                  </th>
                  <th scope="col" className="p-3 font-medium">
                    Summary
                  </th>
                  <th scope="col" className="p-3 font-medium">
                    Request
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.data.map((entry) => (
                  <tr key={entry.id} className="border-b align-top last:border-0">
                    <td className="text-muted-foreground whitespace-nowrap p-3 text-xs">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3 font-medium">{entry.action}</td>
                    <td className="text-muted-foreground p-3 text-xs">
                      {entry.entityType}
                      <br />
                      <span className="font-mono">{entry.entityId.slice(0, 12)}</span>
                    </td>
                    <td className="text-muted-foreground max-w-72 break-all p-3 text-xs">
                      {JSON.stringify(entry.summary)}
                    </td>
                    <td className="text-muted-foreground p-3 font-mono text-[10px]">
                      {entry.requestId.slice(0, 12) || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </Button>
            <span className="text-muted-foreground text-sm">Page {page}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={logs.data.length < 50}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
