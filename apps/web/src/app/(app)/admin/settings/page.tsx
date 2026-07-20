"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import { listSettings, updateSetting, type SystemSetting } from "@/lib/api/admin";

function SettingRow({ setting }: { setting: SystemSetting }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(JSON.stringify(setting.value));

  const save = useMutation({
    mutationFn: () => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(draft);
      } catch {
        throw new Error('The value must be valid JSON (e.g. 24, true, or "text").');
      }
      return updateSetting(setting.key, parsed);
    },
    onSuccess: () => {
      toast.success(`${setting.key} saved`);
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: (error) =>
      toast.error("Could not save setting", {
        description: error instanceof ApiError ? error.message : String(error),
      }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-mono text-sm">{setting.key}</CardTitle>
        <CardDescription>{setting.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex max-w-md items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <div className="flex-1 space-y-1.5">
            <Label htmlFor={`setting-${setting.key}`}>Value (JSON)</Label>
            <Input
              id={`setting-${setting.key}`}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="font-mono text-xs"
            />
          </div>
          <Button type="submit" size="sm" disabled={save.isPending}>
            Save
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function AdminSettingsPage() {
  const settings = useQuery({ queryKey: ["admin-settings"], queryFn: listSettings });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-title-3">System settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Runtime configuration stored in the database. Every change is audit-logged.
        </p>
      </div>
      {settings.isPending ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : settings.isError ? (
        <p className="text-muted-foreground">Settings could not be loaded.</p>
      ) : (
        <div className="space-y-3">
          {settings.data.map((setting) => (
            <SettingRow key={setting.key} setting={setting} />
          ))}
        </div>
      )}
    </div>
  );
}
