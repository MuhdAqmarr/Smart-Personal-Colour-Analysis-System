"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileUp, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import {
  importProductsCsv,
  listImportErrors,
  listImportJobs,
  type ImportResult,
} from "@/lib/api/admin";

function ResultSummary({ result }: { result: ImportResult }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Badge variant={result.dryRun ? "secondary" : "default"}>
          {result.dryRun ? "Dry run — nothing written" : "Committed"}
        </Badge>
        <Badge variant="outline">{result.totalRows} rows</Badge>
        <Badge variant="outline">{result.validRows} valid</Badge>
        {result.errorRows > 0 ? (
          <Badge variant="destructive">{result.errorRows} errors</Badge>
        ) : null}
        {!result.dryRun ? (
          <>
            <Badge variant="outline">{result.insertedRows} inserted</Badge>
            <Badge variant="outline">{result.updatedRows} updated</Badge>
          </>
        ) : null}
      </div>
      {result.errors.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="text-muted-foreground bg-surface border-b text-left text-xs">
                <th scope="col" className="p-2 font-medium">
                  Row
                </th>
                <th scope="col" className="p-2 font-medium">
                  Column
                </th>
                <th scope="col" className="p-2 font-medium">
                  Problem
                </th>
              </tr>
            </thead>
            <tbody>
              {result.errors.map((error, index) => (
                <tr key={`${error.rowNumber}-${index}`} className="border-b last:border-0">
                  <td className="p-2 tabular-nums">{error.rowNumber}</td>
                  <td className="p-2 font-mono text-xs">{error.column}</td>
                  <td className="text-muted-foreground p-2">{error.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminImportsPage() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  const jobs = useQuery({ queryKey: ["import-jobs"], queryFn: listImportJobs });
  const jobErrors = useQuery({
    queryKey: ["import-errors", selectedJob],
    queryFn: () => listImportErrors(selectedJob as string),
    enabled: Boolean(selectedJob),
  });

  const run = useMutation({
    mutationFn: ({ dryRun }: { dryRun: boolean }) => {
      if (!file) throw new Error("Choose a CSV file first.");
      return importProductsCsv(file, dryRun);
    },
    onSuccess: (result) => {
      setPreview(result);
      queryClient.invalidateQueries({ queryKey: ["import-jobs"] });
      if (!result.dryRun) {
        queryClient.invalidateQueries({ queryKey: ["admin-products"] });
        toast.success(
          `Import committed: ${result.insertedRows} inserted, ${result.updatedRows} updated`,
        );
      }
    },
    onError: (error) =>
      toast.error("Import failed", {
        description: error instanceof ApiError ? error.message : String(error),
      }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title-3">Product CSV import</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Always dry-run first: rows are validated and errors reported per row without writing
          anything. A sample file lives at{" "}
          <code className="bg-muted rounded px-1 py-0.5 text-xs">scripts/sample-products.csv</code>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload</CardTitle>
          <CardDescription>UTF-8 CSV with the 17 documented columns, max 2 MB.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setPreview(null);
              }}
            />
            <Button variant="outline" onClick={() => inputRef.current?.click()}>
              <FileUp aria-hidden="true" data-icon="inline-start" />
              {file ? file.name : "Choose CSV file"}
            </Button>
            <Button onClick={() => run.mutate({ dryRun: true })} disabled={!file || run.isPending}>
              Dry run
            </Button>
            <Button
              variant="secondary"
              onClick={() => run.mutate({ dryRun: false })}
              disabled={!file || run.isPending || !preview || preview.validRows === 0}
              title={!preview ? "Run a dry run first" : undefined}
            >
              <Upload aria-hidden="true" data-icon="inline-start" />
              Commit import
            </Button>
          </div>
          {preview ? <ResultSummary result={preview} /> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Import history</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.isPending ? (
            <Skeleton className="h-32 w-full" />
          ) : jobs.isError || jobs.data.length === 0 ? (
            <p className="text-muted-foreground text-sm">No imports recorded yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="text-muted-foreground bg-surface border-b text-left text-xs">
                    <th scope="col" className="p-2 font-medium">
                      File
                    </th>
                    <th scope="col" className="p-2 font-medium">
                      Mode
                    </th>
                    <th scope="col" className="p-2 font-medium">
                      Rows
                    </th>
                    <th scope="col" className="p-2 font-medium">
                      Result
                    </th>
                    <th scope="col" className="p-2 font-medium">
                      When
                    </th>
                    <th scope="col" className="p-2 font-medium">
                      Errors
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.data.map((job) => (
                    <tr key={job.id} className="border-b last:border-0">
                      <td className="max-w-40 truncate p-2 font-medium">{job.filename}</td>
                      <td className="p-2">
                        <Badge
                          variant={job.dryRun ? "secondary" : "default"}
                          className="text-[10px]"
                        >
                          {job.dryRun ? "dry run" : "commit"}
                        </Badge>
                      </td>
                      <td className="p-2 tabular-nums">
                        {job.validRows}/{job.totalRows}
                      </td>
                      <td className="text-muted-foreground p-2 text-xs">
                        {job.dryRun
                          ? "validated"
                          : `${job.insertedRows} ins · ${job.updatedRows} upd`}
                      </td>
                      <td className="text-muted-foreground p-2 text-xs">
                        {new Date(job.createdAt).toLocaleString()}
                      </td>
                      <td className="p-2">
                        {job.errorRows > 0 ? (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => setSelectedJob(selectedJob === job.id ? null : job.id)}
                          >
                            {job.errorRows} errors
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-xs">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedJob && jobErrors.isSuccess ? (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Row errors</h3>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    const lines = [
                      "row_number,column,message",
                      ...jobErrors.data.map(
                        (error) =>
                          `${error.rowNumber},${error.columnName},"${error.errorMessage.replace(/"/g, '""')}"`,
                      ),
                    ];
                    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const anchor = document.createElement("a");
                    anchor.href = url;
                    anchor.download = "import-errors.csv";
                    anchor.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download error report
                </Button>
              </div>
              <ul className="text-muted-foreground max-h-56 space-y-1 overflow-y-auto text-xs">
                {jobErrors.data.map((error, index) => (
                  <li key={index}>
                    Row {error.rowNumber} · {error.columnName}: {error.errorMessage}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
