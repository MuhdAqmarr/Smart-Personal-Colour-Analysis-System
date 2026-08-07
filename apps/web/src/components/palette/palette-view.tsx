"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Copy, Heart, Printer } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

import type { Cosmetic, PaletteColour, SeasonDetail } from "@/lib/api/palettes";
import { favouriteColour, unfavouriteColour } from "@/lib/api/palettes";
import { ApiError } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

const GROUP_META: Record<string, { title: string; blurb: string }> = {
  neutrals: { title: "Neutrals", blurb: "Dependable bases for outfits and layering." },
  core: { title: "Core colours", blurb: "The heart of your palette — safe near the face." },
  accents: { title: "Accents", blurb: "Statement colours for smaller doses." },
  formal: { title: "Formal wear", blurb: "Suits, occasion wear, and workwear." },
  casual: { title: "Casual wear", blurb: "Everyday knits, tees, and denim." },
  accessories: { title: "Accessories", blurb: "Jewellery metals, bags, belts, and shoes." },
  headwear: { title: "Hijab & headwear", blurb: "Tones that flatter right beside the face." },
  cautious: {
    title: "Use with care",
    blurb:
      "Less harmonious with your colouring — worn away from the face or balanced with accessories they can still work.",
  },
};

const GROUP_ORDER = [
  "neutrals",
  "core",
  "accents",
  "formal",
  "casual",
  "accessories",
  "headwear",
  "cautious",
];

const COSMETIC_TYPE_LABELS: Record<string, string> = {
  lipstick: "Lipstick",
  blusher: "Blusher",
  eyeshadow: "Eyeshadow",
  eyeliner: "Eyeliner",
  highlighter: "Highlighter",
  foundation: "Foundation direction",
};

interface PaletteViewProps {
  palette: SeasonDetail;
  /** Enables favourite hearts (requires an authenticated session). */
  interactive?: boolean;
  /** Query keys to invalidate after favouriting. */
  invalidateKeys?: unknown[][];
}

function ColourCard({
  colour,
  cautious,
  interactive,
  onToggleFavourite,
  busy,
}: {
  colour: PaletteColour;
  cautious: boolean;
  interactive: boolean;
  onToggleFavourite: (colour: PaletteColour) => void;
  busy: boolean;
}) {
  async function copyHex() {
    try {
      await navigator.clipboard.writeText(colour.hex);
      toast.success(`${colour.name} copied`, { description: colour.hex });
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  return (
    <li className="bg-card relative rounded-xl border p-2.5 print:break-inside-avoid">
      <div
        aria-hidden="true"
        className={cn(
          "h-16 rounded-lg border border-black/5 print:h-12",
          cautious && "opacity-80 saturate-[0.85]",
        )}
        style={{ backgroundColor: colour.hex }}
      />
      <div className="mt-2 flex items-start justify-between gap-1">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium" title={colour.name}>
            {colour.name}
          </p>
          <button
            type="button"
            onClick={copyHex}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 mt-0.5 inline-flex items-center gap-1 rounded font-mono text-[10px] uppercase outline-none focus-visible:ring-2"
            aria-label={`Copy ${colour.name} colour code ${colour.hex}`}
          >
            {colour.hex}
            <Copy className="size-2.5 print:hidden" aria-hidden="true" />
          </button>
        </div>
        {interactive ? (
          <button
            type="button"
            onClick={() => onToggleFavourite(colour)}
            disabled={busy}
            aria-pressed={colour.isFavourite}
            aria-label={
              colour.isFavourite
                ? `Remove ${colour.name} from favourites`
                : `Add ${colour.name} to favourites`
            }
            className="text-muted-foreground hover:text-primary focus-visible:ring-ring/50 rounded p-0.5 outline-none focus-visible:ring-2 disabled:opacity-50 print:hidden"
          >
            <Heart
              className={cn("size-4", colour.isFavourite && "fill-primary text-primary")}
              aria-hidden="true"
            />
          </button>
        ) : null}
      </div>
      {colour.subseasonSlug ? (
        <Badge variant="secondary" className="mt-1.5 text-[9px]">
          Signature
        </Badge>
      ) : null}
      {colour.recommendedUse && cautious ? (
        <p className="text-muted-foreground mt-1.5 text-[10px] leading-snug">
          {colour.recommendedUse}
        </p>
      ) : null}
    </li>
  );
}

export function PaletteView({
  palette,
  interactive = false,
  invalidateKeys = [],
}: PaletteViewProps) {
  const queryClient = useQueryClient();

  const toggle = useMutation({
    mutationFn: async (colour: PaletteColour) => {
      if (colour.isFavourite) {
        await unfavouriteColour(colour.id);
      } else {
        await favouriteColour(colour.id);
      }
    },
    onSuccess: (_, colour) => {
      toast.success(
        colour.isFavourite ? `${colour.name} removed from favourites` : `${colour.name} saved`,
      );
      for (const key of [["favourite-colours"], ...invalidateKeys]) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
    onError: (error) =>
      toast.error("Could not update favourites", {
        description:
          error instanceof ApiError && error.status === 401
            ? "Sign in to save favourite colours."
            : error instanceof ApiError
              ? error.message
              : undefined,
      }),
  });

  const cosmeticsByType = palette.cosmetics.reduce<Record<string, Cosmetic[]>>(
    (accumulator, cosmetic) => {
      (accumulator[cosmetic.productType] ??= []).push(cosmetic);
      return accumulator;
    },
    {},
  );

  // Decorative colour strip for the printed header.
  const printRibbon = [
    ...(palette.groups.core ?? []),
    ...(palette.groups.accents ?? []),
    ...(palette.groups.neutrals ?? []),
  ].slice(0, 12);

  return (
    <div data-print-root className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-muted-foreground text-sm">
          {palette.appliedSubseason
            ? `Palette for ${palette.appliedSubseason.replace(/-/g, " ")}`
            : `Palette for ${palette.name}`}
          {" · "}tap a swatch code to copy it
        </p>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer aria-hidden="true" data-icon="inline-start" />
          Print palette card
        </Button>
      </div>

      <div className="hidden print:block">
        <div className="flex items-end justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="" width={44} height={44} className="size-11 shrink-0" />
            <div>
              <p className="text-lg font-bold leading-none tracking-[-0.01em]">{siteConfig.name}</p>
              <p className="text-muted-foreground mt-1 text-[11px]">Personal colour analysis</p>
            </div>
          </div>
          <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.18em]">
            Palette card
          </p>
        </div>
        <h2 className="mt-5 text-3xl font-bold capitalize tracking-[-0.02em]">
          {palette.appliedSubseason
            ? palette.appliedSubseason.replace(/-/g, " ")
            : `${palette.name} palette`}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm capitalize">
          {palette.name} season
          <span className="normal-case">
            {" "}
            · generated by {siteConfig.name} · colour codes are sRGB HEX
          </span>
        </p>
        {printRibbon.length > 0 ? (
          <div
            aria-hidden="true"
            className="mt-4 flex h-3.5 overflow-hidden rounded-full border border-black/5"
          >
            {printRibbon.map((colour) => (
              <span key={colour.id} className="flex-1" style={{ backgroundColor: colour.hex }} />
            ))}
          </div>
        ) : null}
      </div>

      {GROUP_ORDER.filter((group) => palette.groups[group]?.length).map((group) => {
        const meta = GROUP_META[group] ?? { title: group, blurb: "" };
        const cautious = group === "cautious";
        return (
          <section key={group} aria-labelledby={`palette-${group}`}>
            <div className="mb-3 flex items-center gap-2">
              {cautious ? (
                <AlertTriangle className="text-warning size-4" aria-hidden="true" />
              ) : null}
              <h3 id={`palette-${group}`} className="text-lg font-semibold tracking-[-0.01em]">
                {meta.title}
              </h3>
            </div>
            <p className="text-muted-foreground mb-3 text-sm">{meta.blurb}</p>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {palette.groups[group].map((colour) => (
                <ColourCard
                  key={colour.id}
                  colour={colour}
                  cautious={cautious}
                  interactive={interactive}
                  onToggleFavourite={(target) => toggle.mutate(target)}
                  busy={toggle.isPending}
                />
              ))}
            </ul>
          </section>
        );
      })}

      {palette.cosmetics.length > 0 ? (
        <section aria-labelledby="palette-cosmetics">
          <h3 id="palette-cosmetics" className="mb-1 text-lg font-semibold">
            Cosmetic directions
          </h3>
          <p className="text-muted-foreground mb-3 text-sm">
            Shade families that harmonise with your season. Always test makeup in daylight —
            especially foundation, which we only ever suggest as an undertone direction.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(cosmeticsByType).map(([type, items]) => (
              <div key={type} data-print-card className="bg-card rounded-xl border p-4">
                <h4 className="text-sm font-semibold">{COSMETIC_TYPE_LABELS[type] ?? type}</h4>
                <ul className="mt-2 space-y-2">
                  {items.map((cosmetic) => (
                    <li key={cosmetic.id} className="flex items-start gap-2.5">
                      <span
                        aria-hidden="true"
                        className="mt-0.5 size-6 shrink-0 rounded-md border border-black/5"
                        style={{ backgroundColor: cosmetic.hex }}
                      />
                      <div className="min-w-0 text-xs leading-snug">
                        <p className="font-medium">
                          {cosmetic.name}
                          <span className="text-muted-foreground font-normal">
                            {" "}
                            · {cosmetic.intensity}
                            {cosmetic.occasion !== "any" ? ` · ${cosmetic.occasion}` : ""}
                          </span>
                        </p>
                        {cosmetic.usageNote ? (
                          <p className="text-muted-foreground mt-0.5">{cosmetic.usageNote}</p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
