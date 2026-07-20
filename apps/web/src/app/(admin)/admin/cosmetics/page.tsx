"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError } from "@/lib/api/client";
import { createCosmetic, deleteCosmetic } from "@/lib/api/admin";
import { getSeasonDetail } from "@/lib/api/palettes";

const SEASONS = ["spring", "summer", "autumn", "winter"];
const TYPES = ["lipstick", "blusher", "eyeshadow", "eyeliner", "highlighter", "foundation"];

export default function AdminCosmeticsPage() {
  const queryClient = useQueryClient();
  const [season, setSeason] = useState("spring");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    productType: "lipstick",
    name: "",
    hex: "#c76e84",
    usageNote: "",
  });

  const palette = useQuery({
    queryKey: ["admin-palette", season],
    queryFn: () => getSeasonDetail(season),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-palette", season] });

  const create = useMutation({
    mutationFn: () =>
      createCosmetic({
        seasonSlug: season,
        productType: form.productType,
        name: form.name,
        hex: form.hex,
        usageNote: form.usageNote,
      }),
    onSuccess: () => {
      toast.success("Cosmetic added");
      invalidate();
      setOpen(false);
    },
    onError: (error) =>
      toast.error("Could not add cosmetic", {
        description: error instanceof ApiError ? error.message : undefined,
      }),
  });

  const remove = useMutation({
    mutationFn: deleteCosmetic,
    onSuccess: () => {
      toast.success("Cosmetic deleted");
      invalidate();
    },
    onError: (error) =>
      toast.error("Could not delete cosmetic", {
        description: error instanceof ApiError ? error.message : undefined,
      }),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-title-3">Cosmetic recommendations</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus aria-hidden="true" data-icon="inline-start" />
            Add to {season}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add cosmetic recommendation</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                create.mutate();
              }}
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cm-type">Type</Label>
                  <select
                    id="cm-type"
                    value={form.productType}
                    onChange={(event) => setForm({ ...form, productType: event.target.value })}
                    className="border-input bg-background h-8 w-full rounded-lg border px-2.5 text-sm capitalize"
                  >
                    {TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cm-hex">Hex</Label>
                  <Input
                    id="cm-hex"
                    required
                    pattern="#[0-9a-fA-F]{6}"
                    value={form.hex}
                    onChange={(event) => setForm({ ...form, hex: event.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cm-name">Name</Label>
                <Input
                  id="cm-name"
                  required
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cm-note">Usage note</Label>
                <Input
                  id="cm-note"
                  value={form.usageNote}
                  onChange={(event) => setForm({ ...form, usageNote: event.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={create.isPending}>
                Add cosmetic
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={season} onValueChange={(value) => value && setSeason(value)}>
        <TabsList>
          {SEASONS.map((slug) => (
            <TabsTrigger key={slug} value={slug} className="capitalize">
              {slug}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {palette.isPending ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : palette.isError ? (
        <p className="text-muted-foreground">Cosmetics could not be loaded.</p>
      ) : (
        <div className="bg-card ring-border overflow-x-auto rounded-xl ring-1">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-muted-foreground bg-surface border-b text-left text-xs">
                <th scope="col" className="p-2.5 font-medium" aria-label="Swatch" />
                <th scope="col" className="p-2.5 font-medium">
                  Name
                </th>
                <th scope="col" className="p-2.5 font-medium">
                  Type
                </th>
                <th scope="col" className="p-2.5 font-medium">
                  Intensity
                </th>
                <th scope="col" className="p-2.5 font-medium">
                  Occasion
                </th>
                <th scope="col" className="p-2.5 font-medium" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {palette.data.cosmetics.map((cosmetic) => (
                <tr key={cosmetic.id} className="border-b last:border-0">
                  <td className="w-12 p-2.5">
                    <span
                      aria-hidden="true"
                      className="block size-7 rounded-md border border-black/5"
                      style={{ backgroundColor: cosmetic.hex }}
                    />
                  </td>
                  <td className="p-2.5 font-medium">{cosmetic.name}</td>
                  <td className="p-2.5 capitalize">{cosmetic.productType}</td>
                  <td className="text-muted-foreground p-2.5 capitalize">{cosmetic.intensity}</td>
                  <td className="text-muted-foreground p-2.5 capitalize">{cosmetic.occasion}</td>
                  <td className="w-12 p-2.5">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Delete ${cosmetic.name}`}
                      onClick={() => remove.mutate(cosmetic.id)}
                      disabled={remove.isPending}
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
