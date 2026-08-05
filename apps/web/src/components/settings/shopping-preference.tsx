"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import { getPreferences, updatePreferences, type ShoppingGender } from "@/lib/api/me";

const OPTIONS: { value: ShoppingGender; label: string }[] = [
  { value: "everyone", label: "Everyone" },
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "unisex", label: "Unisex only" },
];

/**
 * Explicit shopping-gender preference — the user chooses it (the app never
 * infers gender from a photo). Filters product suggestions across the app.
 */
export function ShoppingPreference() {
  const queryClient = useQueryClient();
  const preferences = useQuery({ queryKey: ["preferences"], queryFn: getPreferences });

  const save = useMutation({
    mutationFn: (shoppingGender: ShoppingGender) => updatePreferences({ shoppingGender }),
    onSuccess: (data) => {
      queryClient.setQueryData(["preferences"], data);
      queryClient.invalidateQueries({ queryKey: ["recommended-products"] });
      toast.success("Shopping preference saved");
    },
    onError: (error) =>
      toast.error("Could not save", {
        description: error instanceof ApiError ? error.message : undefined,
      }),
  });

  if (preferences.isPending) return <Skeleton className="h-10 w-full max-w-xs" />;
  if (preferences.isError) {
    return <p className="text-muted-foreground text-sm">Your preferences could not be loaded.</p>;
  }

  return (
    <div className="max-w-xs">
      <Label htmlFor="shopping-gender" className="mb-1.5 block">
        Show products for
      </Label>
      <Select
        value={preferences.data.shoppingGender}
        onValueChange={(value) => value && save.mutate(value as ShoppingGender)}
      >
        <SelectTrigger id="shopping-gender" className="w-full" disabled={save.isPending}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
        Your choice — never guessed from your photo. Applies to product suggestions in your results
        and the “Shop your palette” searches.
      </p>
    </div>
  );
}
