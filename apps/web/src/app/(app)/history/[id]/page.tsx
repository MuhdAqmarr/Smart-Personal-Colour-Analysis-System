"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ImageOff, Trash2 } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" render={<Link href="/history" />}>
          <ArrowLeft aria-hidden="true" data-icon="inline-start" />
          History
        </Button>
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Saved photo</CardTitle>
            <CardDescription>
              Stored privately with your consent; the link below expires after a few minutes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>
      ) : null}

      {classification?.evidence?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Why this result</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-muted-foreground list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
              {classification.evidence.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Measured skin colours</CardTitle>
          <CardDescription>
            Median colour of each sampled region after filtering, in sRGB and CIE Lab.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
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
        </CardContent>
      </Card>

      {palette.isSuccess ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fashion &amp; cosmetic palette</CardTitle>
            <CardDescription>
              The full palette for this result, including hijab-friendly tones and colours to use
              with care.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaletteView
              palette={palette.data}
              interactive
              invalidateKeys={[["analysis-palette", analysisId]]}
            />
          </CardContent>
        </Card>
      ) : null}

      {recommended.isSuccess && recommended.data.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Products for your palette</CardTitle>
            <CardDescription>
              Ranked by CIEDE2000 colour distance to your recommended palette, plus season tags and
              availability. Purchases happen on the external stores.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recommended.data.slice(0, 9).map((product) => (
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
          </CardContent>
        </Card>
      ) : null}

      {classification ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Styling dimensions</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {(
                [
                  ["Temperature", classification.dim_temperature, "Cool", "Warm"],
                  ["Value", classification.dim_value, "Deep", "Light"],
                  ["Chroma", classification.dim_chroma, "Muted", "Clear"],
                  ["Contrast", classification.dim_contrast, "Low", "High"],
                ] as const
              ).map(([label, value, lowLabel, highLabel]) => (
                <div key={label}>
                  <dt className="text-sm font-medium">{label}</dt>
                  <dd className="mt-1.5">
                    <div className="bg-muted h-2 overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${((value ?? 0.5) * 100).toFixed(0)}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground mt-1 flex justify-between text-[10px]">
                      <span>{lowLabel}</span>
                      <span>{highLabel}</span>
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
