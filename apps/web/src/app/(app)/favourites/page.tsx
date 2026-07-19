"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Palette } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import { listFavouriteColours, unfavouriteColour } from "@/lib/api/palettes";
import { ProductCard } from "@/components/products/product-card";
import { listFavouriteProducts, unfavouriteProduct, type Product } from "@/lib/api/products";

export default function FavouritesPage() {
  const queryClient = useQueryClient();
  const favourites = useQuery({
    queryKey: ["favourite-colours"],
    queryFn: listFavouriteColours,
  });

  const favouriteProducts = useQuery({
    queryKey: ["favourite-products"],
    queryFn: listFavouriteProducts,
  });

  const removeProduct = useMutation({
    mutationFn: (product: Product) => unfavouriteProduct(product.id),
    onSuccess: () => {
      toast.success("Removed from favourites");
      queryClient.invalidateQueries({ queryKey: ["favourite-products"] });
    },
    onError: (error) =>
      toast.error("Could not remove", {
        description: error instanceof ApiError ? error.message : undefined,
      }),
  });

  const remove = useMutation({
    mutationFn: unfavouriteColour,
    onSuccess: () => {
      toast.success("Removed from favourites");
      queryClient.invalidateQueries({ queryKey: ["favourite-colours"] });
    },
    onError: (error) =>
      toast.error("Could not remove", {
        description: error instanceof ApiError ? error.message : undefined,
      }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Favourite colours</h1>
        <p className="text-muted-foreground mt-1">
          Colours and products you hearted while exploring palettes and the directory.
        </p>
      </div>

      {favourites.isPending ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Loading favourites">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : favourites.isError ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Could not load favourites</EmptyTitle>
            <EmptyDescription>
              {favourites.error instanceof ApiError
                ? favourites.error.message
                : "Something went wrong."}
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={() => favourites.refetch()}>
            Try again
          </Button>
        </Empty>
      ) : favourites.data.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Palette aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No favourite colours yet</EmptyTitle>
            <EmptyDescription>
              Run an analysis or browse a season palette and tap the heart on colours you love.
            </EmptyDescription>
          </EmptyHeader>
          <Button render={<Link href="/analysis" />}>Start an analysis</Button>
        </Empty>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {favourites.data.map((colour) => (
            <li key={colour.id} className="bg-card rounded-xl border p-3">
              <div
                aria-hidden="true"
                className="h-20 rounded-lg border border-black/5"
                style={{ backgroundColor: colour.hex }}
              />
              <div className="mt-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium" title={colour.name}>
                    {colour.name}
                  </p>
                  <p className="text-muted-foreground font-mono text-[10px] uppercase">
                    {colour.hex}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {colour.seasonName} · {colour.paletteGroup}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove.mutate(colour.id)}
                  disabled={remove.isPending}
                  aria-label={`Remove ${colour.name} from favourites`}
                  className="text-primary focus-visible:ring-ring/50 rounded p-1 outline-none focus-visible:ring-2 disabled:opacity-50"
                >
                  <Heart className="fill-primary size-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <section aria-labelledby="favourite-products-heading" className="border-t pt-6">
        <h2 id="favourite-products-heading" className="font-heading text-2xl font-semibold">
          Favourite products
        </h2>
        {favouriteProducts.isPending ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-56 rounded-xl" />
            ))}
          </div>
        ) : favouriteProducts.isError || favouriteProducts.data.length === 0 ? (
          <p className="text-muted-foreground mt-3 text-sm">
            No favourite products yet — browse the directory and tap the heart on pieces you like.
          </p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favouriteProducts.data.map((product) => (
              <li key={product.id}>
                <ProductCard
                  product={product}
                  interactive
                  onToggleFavourite={(target) => removeProduct.mutate(target)}
                  favouriteBusy={removeProduct.isPending}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
