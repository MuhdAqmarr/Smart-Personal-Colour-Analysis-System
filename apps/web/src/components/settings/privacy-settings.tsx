"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { deleteAllAnalyses } from "@/lib/api/analyses";
import { ApiError } from "@/lib/api/client";
import { deleteAccount, getPreferences, updatePreferences } from "@/lib/api/me";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function PrivacySettings() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const preferences = useQuery({ queryKey: ["preferences"], queryFn: getPreferences });

  const savePreference = useMutation({
    mutationFn: updatePreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(["preferences"], data);
      toast.success("Preference saved");
    },
    onError: (error) =>
      toast.error("Could not save", {
        description: error instanceof ApiError ? error.message : undefined,
      }),
  });

  const wipeHistory = useMutation({
    mutationFn: deleteAllAnalyses,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
      toast.success("Your complete analysis history was deleted");
    },
    onError: (error) =>
      toast.error("Could not delete history", {
        description: error instanceof ApiError ? error.message : undefined,
      }),
  });

  const removeAccount = useMutation({
    mutationFn: deleteAccount,
    onSuccess: async () => {
      const supabase = getSupabaseBrowserClient();
      await supabase?.auth.signOut();
      toast.success("Your account and all associated data were deleted");
      router.push("/");
      router.refresh();
    },
    onError: (error) =>
      toast.error("Could not delete the account", {
        description: error instanceof ApiError ? error.message : undefined,
      }),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Image storage default</CardTitle>
          <CardDescription>
            Controls how the “save my analysis image” option starts on the consent step. Even when
            on, each analysis still asks you explicitly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {preferences.isPending ? (
            <Skeleton className="h-6 w-64" />
          ) : preferences.isError ? (
            <p className="text-muted-foreground text-sm">Preferences could not be loaded.</p>
          ) : (
            <div className="flex items-center gap-3">
              <Switch
                id="pref-image-storage"
                checked={preferences.data.defaultImageStorage}
                onCheckedChange={(checked) =>
                  savePreference.mutate({ defaultImageStorage: checked === true })
                }
                disabled={savePreference.isPending}
              />
              <Label htmlFor="pref-image-storage">
                Pre-tick “save my analysis image” on new analyses
              </Label>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Delete analysis history</CardTitle>
          <CardDescription>
            Removes every saved analysis, all colour measurements, and any stored photos. Your
            account stays active.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button variant="outline" disabled={wipeHistory.isPending} />}
            >
              Delete my complete history
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete every saved analysis?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes all analyses and stored photos. It cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => wipeHistory.mutate()}>
                  Yes, delete everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Delete account</CardTitle>
          <CardDescription>
            Permanently deletes your account together with every analysis, preference, consent
            record, favourite, and stored photo you own.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button variant="destructive" disabled={removeAccount.isPending} />}
            >
              Delete my account
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account permanently?</AlertDialogTitle>
                <AlertDialogDescription>
                  All of your data will be removed and you will be signed out. There is no way to
                  restore a deleted account.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep my account</AlertDialogCancel>
                <AlertDialogAction onClick={() => removeAccount.mutate()}>
                  Delete my account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
