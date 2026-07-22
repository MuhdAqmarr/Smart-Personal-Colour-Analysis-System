"use client";

import { ExternalLink, ShoppingBag } from "lucide-react";
import { useState } from "react";

import { ColourChip } from "@/components/design-system/colour-chip";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PaletteColour, SeasonDetail } from "@/lib/api/palettes";
import { buildShopQuery, SHOP_CATEGORIES, SHOP_PLATFORMS } from "@/lib/shop-links";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

// The wearable heart of the palette — the colours worth shopping for.
// "cautious" (colours to use sparingly) is deliberately excluded.
const WEARABLE_GROUPS = ["core", "neutrals", "accents"];
const MAX_COLOURS = 16;

function curatedColours(palette: SeasonDetail): PaletteColour[] {
  const seen = new Set<string>();
  const out: PaletteColour[] = [];
  for (const group of WEARABLE_GROUPS) {
    for (const colour of palette.groups[group] ?? []) {
      const key = colour.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(colour);
      if (out.length >= MAX_COLOURS) return out;
    }
  }
  return out;
}

/**
 * "Shop your palette" — turns the analysis result into live marketplace
 * searches. Pick a colour and category; each button opens that platform's
 * own search in a new tab. No scraping, no measured-match claim: this is
 * search assistance, kept distinct from the internal CIEDE2000 ranking.
 */
export function ShopPalette({ palette, className }: { palette: SeasonDetail; className?: string }) {
  const colours = curatedColours(palette);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [category, setCategory] = useState("all");

  if (colours.length === 0) return null;

  const colour = colours[Math.min(selectedIndex, colours.length - 1)];
  const categoryOption =
    SHOP_CATEGORIES.find((option) => option.value === category) ?? SHOP_CATEGORIES[0];
  const query = buildShopQuery(colour.name, categoryOption.term);

  return (
    <section
      aria-labelledby="shop-palette-heading"
      className={cn("bg-card ring-border shadow-xs rounded-2xl p-5 ring-1 sm:p-6", className)}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="bg-secondary text-foreground flex size-9 shrink-0 items-center justify-center rounded-lg"
        >
          <ShoppingBag className="size-4.5" />
        </span>
        <div className="min-w-0">
          <h3 id="shop-palette-heading" className="text-base font-semibold tracking-[-0.01em]">
            Shop your palette
          </h3>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            Open a live marketplace search for any of your colours. Listings and their colours are
            provided by the store and may differ from your palette or screen.
          </p>
        </div>
      </div>

      <div className="mt-5 max-w-xs">
        <Label htmlFor="shop-category" className="mb-1.5 block">
          Category
        </Label>
        <Select value={category} onValueChange={(value) => value && setCategory(value)}>
          <SelectTrigger id="shop-category" className="w-full">
            <SelectValue>
              {(value) =>
                SHOP_CATEGORIES.find((option) => option.value === value)?.label ?? "All items"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SHOP_CATEGORIES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <fieldset className="mt-5">
        <legend className="text-muted-foreground mb-2 text-[0.8125rem] font-medium">
          Choose a colour
        </legend>
        <div className="flex flex-wrap gap-2">
          {colours.map((item, index) => {
            const active = index === Math.min(selectedIndex, colours.length - 1);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-pressed={active}
                className={cn(
                  "focus-visible:ring-ring/50 duration-(--motion-fast) focus-visible:ring-3 flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm font-medium outline-none transition-colors",
                  active
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "border-border hover:bg-surface text-foreground",
                )}
              >
                <ColourChip hex={item.hex} size="sm" className="size-5" />
                {item.name}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="border-separator mt-5 border-t pt-5">
        <p className="text-sm">
          Search <span className="font-semibold">“{query}”</span> on:
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SHOP_PLATFORMS.map((platform) => (
            <Button
              key={platform.id}
              variant="outline"
              size="sm"
              render={
                <a
                  href={platform.buildUrl(query)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Search ${query} on ${platform.name} (opens in a new tab)`}
                />
              }
            >
              {platform.name}
              <ExternalLink aria-hidden="true" data-icon="inline-end" />
            </Button>
          ))}
        </div>
        <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
          Opens the store’s own search in a new tab. Purchases and prices happen on the external
          site — {siteConfig.name} does not sell or verify these products.
        </p>
      </div>
    </section>
  );
}
