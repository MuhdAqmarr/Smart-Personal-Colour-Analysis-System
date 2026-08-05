"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ImageOff, Store, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ResultSection } from "@/components/analysis/result-section";
import { PaletteView } from "@/components/palette/palette-view";
import {
  deleteAnalysis,
  deleteAnalysisImage,
  getAnalysis,
  type StoredSample,
} from "@/lib/api/analyses";
import { ApiError } from "@/lib/api/client";
import { getAnalysisPalette } from "@/lib/api/palettes";
import { ProductCard } from "@/components/products/product-card";
import { ShopPalette } from "@/components/products/shop-palette";
import {
  favouriteProduct,
  getRecommendedProducts,
  unfavouriteProduct,
  type Product,
} from "@/lib/api/products";

function titleCase(slug: string | null): string {
  if (!slug) return "";
  return slug
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Group recommended products by store, preserving match-rank order. Products
 * arrive best-match-first, so Map insertion order puts the store with the
 * top-matching product first, and each store's items stay match-sorted.
 */
function groupByStore(products: Product[]): { store: string; items: Product[] }[] {
  const groups = new Map<string, Product[]>();
  for (const product of products) {
    const existing = groups.get(product.storeName);
    if (existing) existing.push(product);
    else groups.set(product.storeName, [product]);
  }
  return Array.from(groups, ([store, items]) => ({ store, items }));
}

function SampleRow({ sample }: { sample: StoredSample }) {
  return (
    <tr className="border-border/60 border-b last:border-0">
      <td className="py-2 pr-3">
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-5 rounded-md border border-black/5"
            style={{ backgroundColor: sample.hex }}
          />
          <span className="capitalize">{sample.region.replace("_", " ")}</span>
        </span>
      </td>
      <td className="px-3 py-2 font-mono text-xs uppercase">{sample.hex}</td>
      <td className="px-3 py-2 tabular-nums">
        {sample.labL.toFixed(1)} / {sample.labA.toFixed(1)} / {sample.labB.toFixed(1)}
      </td>
      <td className="px-3 py-2 tabular-nums">{sample.chroma.toFixed(1)}</td>
      <td className="px-3 py-2 tabular-nums">{sample.hueAngleDegrees.toFixed(0)}°</td>
      <td className="py-2 pl-3 tabular-nums">{(sample.usablePixelRatio * 100).toFixed(0)}%</td>
    </tr>
  );
}

export default function AnalysisDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const analysisId = params.id;

  const query = useQuery({
    queryKey: ["analyses", "detail", analysisId],
    queryFn: () => getAnalysis(analysisId),
  });

  const palette = useQuery({
    queryKey: ["analysis-palette", analysisId],
    queryFn: () => getAnalysisPalette(analysisId),
    enabled: query.isSuccess,
  });

  const recommended = useQuery({
    queryKey: ["recommended-products", analysisId],
    queryFn: () => getRecommendedProducts(analysisId),
    enabled: query.isSuccess,
  });

  const toggleFavourite = useMutation({
    mutationFn: async (product: Product) => {
      if (product.isFavourite) await unfavouriteProduct(product.id);
      else await favouriteProduct(product.id);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["recommended-products", analysisId] }),
    onError: (error) =>
      toast.error("Could not update favourites", {
        description: error instanceof ApiError ? error.message : undefined,
      }),
  });

  const removeAnalysis = useMutation({
    mutationFn: () => deleteAnalysis(analysisId),
    onSuccess: () => {
      toast.success("Analysis deleted");
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
      router.push("/history");
    },
    onError: (error) =>
      toast.error("Could not delete", {
        description: error instanceof ApiError ? error.message : undefined,
      }),
  });

  const removeImage = useMutation({
    mutationFn: () => deleteAnalysisImage(analysisId),
    onSuccess: () => {
      toast.success("Stored photo deleted");
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
    },
    onError: (error) =>
      toast.error("Could not delete the photo", {
        description: error instanceof ApiError ? error.message : undefined,
      }),
  });

  if (query.isPending) {
    return (
      <div className="space-y-4" aria-label="Loading analysis">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          {query.error instanceof ApiError && query.error.status === 404
            ? "This analysis does not exist or belongs to another account."
            : "The analysis could not be loaded."}
        </p>
        <Button variant="outline" render={<Link href="/history" />}>
          <ArrowLeft aria-hidden="true" data-icon="inline-start" />
          Back to history
        </Button>
      </div>
    );
  }

  const detail = query.data;
  const headline = titleCase(detail.subseasonSlug ?? detail.seasonSlug);
  const quality = detail.quality as {
    overall_score?: number;
    issues?: { code: string; message: string; severity: string }[];
  } | null;
  const classification = detail.classification as {
    evidence?: string[];
    improvement_tips?: string[];
    dim_temperature?: number;
    dim_value?: number;
    dim_chroma?: number;
    dim_contrast?: number;
  } | null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
            <Trash2 aria-hidden="true" data-icon="inline-start" />
            Delete analysis
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this analysis?</AlertDialogTitle>
              <AlertDialogDescription>
                The result, all colour measurements
                {detail.hasImage ? ", and the saved photo" : ""} will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it</AlertDialogCancel>
              <AlertDialogAction onClick={() => removeAnalysis.mutate()}>
                Delete permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div
        className="wash-season ring-border rounded-3xl px-6 py-10 text-center ring-1"
        style={
          {
            "--season-tint": `var(--season-${detail.seasonSlug}, var(--accent))`,
          } as React.CSSProperties
        }
      >
        <p className="text-muted-foreground text-sm">
          {new Date(detail.createdAt).toLocaleString()}
        </p>
        <h1 className="text-title-1 mt-2">{headline}</h1>
        <p className="text-muted-foreground mt-1 capitalize">{detail.undertone} undertone</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Badge className="bg-card/60 text-foreground capitalize">
            {detail.confidenceLabel} confidence · {(detail.confidence * 100).toFixed(0)}%
          </Badge>
          {quality?.overall_score != null ? (
            <Badge variant="outline" className="bg-card/60">
              Quality {Number(quality.overall_score).toFixed(0)}/100
            </Badge>
          ) : null}
          <Badge variant="outline" className="bg-card/60">
            Classifier v{detail.classifierVersion}
          </Badge>
        </div>
      </div>

      {detail.imageUrl ? (
        <ResultSection
          title="Saved photo"
          description="Stored privately with your consent; the link below expires after a few minutes."
        >
          <div className="space-y-3">
            {/* Signed, short-lived URL from private storage. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={detail.imageUrl}
              alt="Your saved analysis photo"
              className="mx-auto max-h-80 rounded-xl border object-contain"
            />
            <div className="text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeImage.mutate()}
                disabled={removeImage.isPending}
              >
                <ImageOff aria-hidden="true" data-icon="inline-start" />
                Delete the stored photo
              </Button>
            </div>
          </div>
        </ResultSection>
      ) : null}

      {classification?.evidence?.length ? (
        <ResultSection title="Why this result">
          <ul className="text-muted-foreground list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
            {classification.evidence.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </ResultSection>
      ) : null}

      <ResultSection
        title="Measured skin colours"
        description="Median colour of each sampled region after filtering, in sRGB and CIE Lab."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] text-sm">
            <thead>
              <tr className="text-muted-foreground border-border/60 border-b text-left text-xs">
                <th scope="col" className="py-2 pr-3 font-medium">
                  Region
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  HEX
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  L* / a* / b*
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Chroma
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Hue
                </th>
                <th scope="col" className="py-2 pl-3 font-medium">
                  Usable
                </th>
              </tr>
            </thead>
            <tbody>
              {detail.samples.map((sample) => (
                <SampleRow key={sample.region} sample={sample} />
              ))}
            </tbody>
          </table>
        </div>
      </ResultSection>

      {palette.isSuccess ? (
        <ResultSection
          title="Fashion &amp; cosmetic palette"
          description="The full palette for this result, including hijab-friendly tones and colours to use with care."
          defaultOpen
        >
          <PaletteView
            palette={palette.data}
            interactive
            invalidateKeys={[["analysis-palette", analysisId]]}
          />
        </ResultSection>
      ) : null}

      {palette.isSuccess ? (
        <ResultSection
          title="Shop your palette"
          description="Open a live marketplace search for any of your colours. Listings and their colours are provided by the store and may differ from your palette or screen."
        >
          <ShopPalette palette={palette.data} bare />
        </ResultSection>
      ) : null}

      {recommended.isSuccess && recommended.data.length > 0 ? (
        <ResultSection
          title="Products for your palette"
          description="Ranked by CIEDE2000 colour distance to your recommended palette, plus season tags and availability. Purchases happen on the external stores."
          meta={<Badge variant="secondary">{Math.min(recommended.data.length, 9)}</Badge>}
        >
          <div className="space-y-6">
            {groupByStore(recommended.data.slice(0, 9)).map(({ store, items }) => (
              <div key={store}>
                <h3 className="text-muted-foreground mb-3 flex items-center gap-1.5 text-sm font-semibold">
                  <Store className="size-4 shrink-0" aria-hidden="true" />
                  {store}
                  <span className="text-muted-foreground/70 font-normal">· {items.length}</span>
                </h3>
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((product) => (
                    <li key={product.id}>
                      <ProductCard
                        product={product}
                        interactive
                        onToggleFavourite={(target) => toggleFavourite.mutate(target)}
                        favouriteBusy={toggleFavourite.isPending}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ResultSection>
      ) : null}

      {classification ? (
        <ResultSection
          title="Styling dimensions"
          description="The four traits the engine measures from your photo to choose your season — your season is the one whose typical profile sits closest to where these bars land. The marker shows where you fall between the two ends."
        >
          <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
            {(
              [
                [
                  "Temperature",
                  classification.dim_temperature,
                  "Cool",
                  "Warm",
                  "Your undertone — how warm or cool your skin reads.",
                ],
                [
                  "Value",
                  classification.dim_value,
                  "Deep",
                  "Light",
                  "How light or deep your natural colouring is.",
                ],
                [
                  "Chroma",
                  classification.dim_chroma,
                  "Muted",
                  "Clear",
                  "How clear and vivid vs soft and muted your colouring is.",
                ],
                [
                  "Contrast",
                  classification.dim_contrast,
                  "Low",
                  "High",
                  "The light-to-dark gap across your features.",
                ],
              ] as const
            ).map(([label, value, lowLabel, highLabel, hint]) => (
              <div key={label} className="flex flex-col">
                <dt className="text-sm font-medium">{label}</dt>
                <p className="text-muted-foreground mt-0.5 text-xs leading-snug">{hint}</p>
                <dd className="mt-auto pt-3">
                  <div className="bg-muted relative h-2 rounded-full">
                    {/* Marker for where this trait falls on the axis. */}
                    <div
                      className="bg-primary ring-card absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2"
                      style={{ left: `${((value ?? 0.5) * 100).toFixed(0)}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground mt-1.5 flex justify-between text-[10px]">
                    <span>{lowLabel}</span>
                    <span>{highLabel}</span>
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </ResultSection>
      ) : null}
    </div>
  );
}
