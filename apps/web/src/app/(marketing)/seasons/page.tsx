import type { Metadata } from "next";
import Link from "next/link";

import { SwatchGrid } from "@/components/colour/swatch-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { seasonPreviews } from "@/lib/seasons-preview";

export const metadata: Metadata = {
  title: "Colour seasons",
  description:
    "Spring, Summer, Autumn, and Winter — how the four colour seasons and twelve sub-seasons describe personal colouring.",
};

const seasonTints: Record<string, string> = {
  spring: "var(--season-spring)",
  summer: "var(--season-summer)",
  autumn: "var(--season-autumn)",
  winter: "var(--season-winter)",
};

export default function SeasonsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
      <p className="text-eyebrow text-muted-foreground">Colour theory</p>
      <h1 className="text-title-1 mt-3">The colour seasons</h1>
      <p className="text-muted-foreground mt-4 max-w-2xl leading-relaxed">
        Seasonal colour analysis describes personal colouring along four dimensions:
        <strong className="text-foreground font-medium"> temperature</strong> (warm or cool),
        <strong className="text-foreground font-medium"> value</strong> (light to deep),
        <strong className="text-foreground font-medium"> chroma</strong> (muted to clear), and
        <strong className="text-foreground font-medium"> contrast</strong>. The analysis estimates
        where you sit on each dimension and finds the season whose character matches best.
      </p>

      <div className="mt-12 space-y-8">
        {seasonPreviews.map((season) => (
          <article
            key={season.slug}
            id={season.slug}
            className="wash-season ring-border scroll-mt-24 rounded-2xl p-6 ring-1 sm:p-8"
            style={{ "--season-tint": seasonTints[season.slug] } as React.CSSProperties}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-title-2">{season.name}</h2>
                <p className="text-muted-foreground mt-1 text-sm">{season.tagline}</p>
              </div>
              <div className="flex flex-wrap gap-2" aria-label={`${season.name} characteristics`}>
                <Badge variant="outline">{season.traits.temperature}</Badge>
                <Badge variant="outline">Value: {season.traits.value}</Badge>
                <Badge variant="outline">Chroma: {season.traits.chroma}</Badge>
                <Badge variant="outline">Contrast: {season.traits.contrast}</Badge>
              </div>
            </div>
            <div className="mt-6 space-y-6">
              <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
                {season.summary}
              </p>
              <SwatchGrid swatches={season.swatches} showLabels />
              <div>
                <h3 className="mb-3 text-sm font-semibold">Sub-seasons of {season.name}</h3>
                <ul className="grid gap-3 sm:grid-cols-3">
                  {season.subSeasons.map((sub) => (
                    <li key={sub.slug} className="bg-card/70 ring-border rounded-xl p-3.5 ring-1">
                      <p className="text-sm font-medium">{sub.name}</p>
                      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                        {sub.note}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-14 text-center">
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
