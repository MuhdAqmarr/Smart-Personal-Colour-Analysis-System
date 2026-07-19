"use client";

import { ExternalLink, Heart } from "lucide-react";

import type { Product } from "@/lib/api/products";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  /** Show the favourite toggle (authenticated users). */
  interactive?: boolean;
  onToggleFavourite?: (product: Product) => void;
  favouriteBusy?: boolean;
}

function formatPrice(product: Product): string | null {
  if (product.price == null) return null;
  return `${product.currency} ${product.price.toFixed(2)}`;
}

/**
 * External links open safely: http/https URLs only (validated server-side),
 * new tab, noopener/noreferrer, destination store named, purchase notice.
 */
export function ProductCard({
  product,
  interactive = false,
  onToggleFavourite,
  favouriteBusy = false,
}: ProductCardProps) {
  const primaryColour = product.colours.find((colour) => colour.isPrimary) ?? product.colours[0];
  const price = formatPrice(product);

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-3">
        <div
          aria-hidden="true"
          className="relative h-28 rounded-lg border border-black/5"
          style={{ backgroundColor: primaryColour?.hex ?? "#d8d2c8" }}
        >
          {product.isDemo ? (
            <Badge variant="secondary" className="absolute left-2 top-2 text-[10px]">
              Demo data
            </Badge>
          ) : null}
          {product.matchScore != null ? (
            <Badge className="absolute right-2 top-2 text-[10px]">
              {(product.matchScore * 100).toFixed(0)}% match
            </Badge>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-snug">{product.name}</p>
            {interactive ? (
              <button
                type="button"
                onClick={() => onToggleFavourite?.(product)}
                disabled={favouriteBusy}
                aria-pressed={product.isFavourite}
                aria-label={
                  product.isFavourite
                    ? `Remove ${product.name} from favourites`
                    : `Add ${product.name} to favourites`
                }
                className="text-muted-foreground hover:text-primary focus-visible:ring-ring/50 shrink-0 rounded p-0.5 outline-none focus-visible:ring-2 disabled:opacity-50"
              >
                <Heart
                  className={cn("size-4", product.isFavourite && "fill-primary text-primary")}
                  aria-hidden="true"
                />
              </button>
            ) : null}
          </div>
          <p className="text-muted-foreground mt-0.5 text-xs capitalize">
            {product.brand ? `${product.brand} · ` : ""}
            {product.category}
            {primaryColour?.colourName ? ` · ${primaryColour.colourName}` : ""}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {price ? <span className="text-sm font-semibold">{price}</span> : null}
            {product.availability === "out_of_stock" ? (
              <Badge variant="outline" className="text-[10px]">
                Out of stock
              </Badge>
            ) : null}
            {product.seasonTags.slice(0, 2).map((tag) => (
              <Badge
                key={`${tag.seasonSlug}-${tag.subseasonSlug}`}
                variant="outline"
                className="text-[10px] capitalize"
              >
                {tag.subseasonSlug ? tag.subseasonSlug.replace(/-/g, " ") : tag.seasonSlug}
              </Badge>
            ))}
          </div>
        </div>

        <div className="border-t pt-2.5">
          <a
            href={product.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary focus-visible:ring-ring/50 inline-flex items-center gap-1.5 rounded text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-2"
          >
            View at {product.storeName}
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
          <p className="text-muted-foreground mt-1 text-[10px] leading-snug">
            Purchase happens on the external store. Product photos may differ from real-world
            colour.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
