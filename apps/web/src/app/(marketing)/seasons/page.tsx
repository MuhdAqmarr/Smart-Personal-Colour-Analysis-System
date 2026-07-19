import type { Metadata } from "next";
import Link from "next/link";

import { SwatchGrid } from "@/components/colour/swatch-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { seasonPreviews } from "@/lib/seasons-preview";

export const metadata: Metadata = {
  title: "Colour seasons",
  description:
    "Spring, Summer, Autumn, and Winter — how the four colour seasons and twelve sub-seasons describe personal colouring.",
};

export default function SeasonsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
      <h1 className="font-heading text-4xl font-semibold tracking-tight">The colour seasons</h1>
      <p className="text-muted-foreground mt-4 max-w-2xl leading-relaxed">
        Seasonal colour analysis describes personal colouring along four dimensions:
        <strong className="text-foreground"> temperature</strong> (warm or cool),
        <strong className="text-foreground"> value</strong> (light to deep),
        <strong className="text-foreground"> chroma</strong> (muted to clear), and
        <strong className="text-foreground"> contrast</strong>. The analysis estimates where you sit
        on each dimension and finds the season whose character matches best.
      </p>

      <div className="mt-10 space-y-8">
        {seasonPreviews.map((season) => (
          <Card key={season.slug} id={season.slug} className="scroll-mt-24">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-heading text-2xl font-medium leading-snug">{season.name}</h2>
                  <CardDescription className="mt-1">{season.tagline}</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2" aria-label={`${season.name} characteristics`}>
                  <Badge variant="outline">{season.traits.temperature}</Badge>
                  <Badge variant="outline">Value: {season.traits.value}</Badge>
                  <Badge variant="outline">Chroma: {season.traits.chroma}</Badge>
                  <Badge variant="outline">Contrast: {season.traits.contrast}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground max-w-3xl leading-relaxed">{season.summary}</p>
              <SwatchGrid swatches={season.swatches} showLabels />
              <div>
                <h3 className="font-heading mb-3 text-sm font-semibold">
                  Sub-seasons of {season.name}
                </h3>
                <ul className="grid gap-3 sm:grid-cols-3">
                  {season.subSeasons.map((sub) => (
                    <li key={sub.slug} className="bg-secondary/50 rounded-lg border p-3">
                      <p className="text-sm font-medium">{sub.name}</p>
                      <p className="text-muted-foreground mt-1 text-xs">{sub.note}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-muted-foreground mb-4">
          Curious which season the analysis suggests for you?
        </p>
        <Button size="lg" render={<Link href="/analysis" />}>
          Start your analysis
        </Button>
      </div>
    </div>
  );
}
