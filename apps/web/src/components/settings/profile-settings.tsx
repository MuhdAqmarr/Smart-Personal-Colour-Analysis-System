"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api/client";
import { updateDisplayName } from "@/lib/api/me";
import { useSession } from "@/hooks/use-session";

export function ProfileSettings() {
  const { session } = useSession();
  const initial = (session?.user.user_metadata?.display_name as string | undefined) ?? "";
  const [displayName, setDisplayName] = useState(initial);

  const save = useMutation({
    mutationFn: () => updateDisplayName(displayName.trim()),
    onSuccess: async () => {
      toast.success("Display name updated");
    },
    onError: (error) =>
      toast.error("Could not update", {
        description: error instanceof ApiError ? error.message : undefined,
      }),
  });

  return (
    <form
      className="flex max-w-md items-end gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (displayName.trim().length > 0) save.mutate();
      }}
    >
      <div className="flex-1 space-y-2">
        <Label htmlFor="display-name">Display name</Label>
        <Input
          id="display-name"
          value={displayName}
          placeholder={initial || "Your name"}
          maxLength={120}
          onChange={(event) => setDisplayName(event.target.value)}
        />
      </div>
      <Button type="submit" disabled={save.isPending || displayName.trim().length === 0}>
        {save.isPending ? <Spinner /> : null}
        Save
      </Button>
    </form>
  );
}
