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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError } from "@/lib/api/client";
import { createPaletteColour, deletePaletteColour, updatePaletteColour } from "@/lib/api/admin";
import { getSeasonDetail } from "@/lib/api/palettes";

const SEASONS = ["spring", "summer", "autumn", "winter"];
const GROUPS = [
  "neutrals",
  "core",
  "accents",
  "formal",
  "casual",
  "accessories",
  "headwear",
  "cautious",
];

export default function AdminPalettesPage() {
  const queryClient = useQueryClient();
  const [season, setSeason] = useState("spring");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    hex: "#d4a373",
    paletteGroup: "core",
    recommendedUse: "",
  });

  const palette = useQuery({
    queryKey: ["admin-palette", season],
    queryFn: () => getSeasonDetail(season),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-palette", season] });
    queryClient.invalidateQueries({ queryKey: ["season-palette"] });
  };

  const create = useMutation({
    mutationFn: () =>
      createPaletteColour({
        seasonSlug: season,
        name: form.name,
        hex: form.hex,
        paletteGroup: form.paletteGroup,
        recommendedUse: form.recommendedUse,
      }),
    onSuccess: () => {
      toast.success("Colour added");
      invalidate();
      setOpen(false);
    },
    onError: (error) =>
      toast.error("Could not add colour", {
        description: error instanceof ApiError ? error.message : undefined,
      }),
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updatePaletteColour(id, { isActive }),
    onSuccess: invalidate,
    onError: (error) =>
      toast.error("Could not update colour", {
        description: error instanceof ApiError ? error.message : undefined,
      }),
  });

  const remove = useMutation({
    mutationFn: deletePaletteColour,
    onSuccess: () => {
      toast.success("Colour deleted");
      invalidate();
    },
    onError: (error) =>
      toast.error("Could not delete colour", {
        description: error instanceof ApiError ? error.message : undefined,
      }),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Palette colours</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus aria-hidden="true" data-icon="inline-start" />
            Add colour to {season}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add palette colour</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                create.mutate();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="pc-name">Name</Label>
                <Input
                  id="pc-name"
                  required
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pc-hex">Hex</Label>
                  <Input
                    id="pc-hex"
                    required
                    pattern="#[0-9a-fA-F]{6}"
                    value={form.hex}
                    onChange={(event) => setForm({ ...form, hex: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pc-group">Group</Label>
                  <select
                    id="pc-group"
                    value={form.paletteGroup}
                    onChange={(event) => setForm({ ...form, paletteGroup: event.target.value })}
                    className="border-input bg-background h-8 w-full rounded-lg border px-2.5 text-sm capitalize"
                  >
                    {GROUPS.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pc-use">Recommended use</Label>
                <Input
                  id="pc-use"
                  value={form.recommendedUse}
                  onChange={(event) => setForm({ ...form, recommendedUse: event.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={create.isPending}>
                Add colour
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
        <Skeleton className="h-72 w-full rounded-xl" />
      ) : palette.isError ? (
        <p className="text-muted-foreground">Palette could not be loaded.</p>
      ) : (
        <div className="space-y-6">
          {GROUPS.filter((group) => palette.data.groups[group]?.length).map((group) => (
            <section key={group} aria-label={`${group} colours`}>
              <h2 className="font-heading mb-2 text-lg font-semibold capitalize">{group}</h2>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[560px] text-sm">
                  <tbody>
                    {palette.data.groups[group].map((colour) => (
                      <tr key={colour.id} className="border-b last:border-0">
                        <td className="w-12 p-2.5">
                          <span
                            aria-hidden="true"
                            className="block size-7 rounded-md border border-black/5"
                            style={{ backgroundColor: colour.hex }}
                          />
                        </td>
                        <td className="p-2.5 font-medium">{colour.name}</td>
                        <td className="text-muted-foreground p-2.5 font-mono text-xs uppercase">
                          {colour.hex}
                        </td>
                        <td className="text-muted-foreground max-w-56 truncate p-2.5 text-xs">
                          {colour.recommendedUse || "—"}
                        </td>
                        <td className="w-24 p-2.5">
                          <span className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label={`Delete ${colour.name}`}
                              onClick={() => remove.mutate(colour.id)}
                              disabled={remove.isPending}
                            >
                              <Trash2 className="size-3.5" aria-hidden="true" />
                            </Button>
                            <Switch
                              checked
                              onCheckedChange={() =>
                                toggle.mutate({ id: colour.id, isActive: false })
                              }
                              aria-label={`Deactivate ${colour.name}`}
                              disabled={toggle.isPending}
                            />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
          <p className="text-muted-foreground text-xs">
            Deactivated colours disappear from public palettes immediately but stay in the database;
            deletion is permanent. Historical analyses always keep their own copies of measured
            values.
          </p>
        </div>
      )}
    </div>
  );
}
