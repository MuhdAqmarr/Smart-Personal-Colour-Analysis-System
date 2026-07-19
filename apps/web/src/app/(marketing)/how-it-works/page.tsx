import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "The full pipeline behind the analysis: quality checks, facial landmarks, CIE Lab colour science, and a rule-based season classifier.",
};

const stages = [
  {
    title: "1 — Consent first",
    body: "Before anything happens you see exactly why a photo is needed, which facial regions are analysed, what is (and is not) stored, and how deletion works. Analysis only starts after you agree.",
  },
  {
    title: "2 — Photo capture or upload",
    body: "Use your device camera (front camera on phones, with an on-screen face guide) or upload a JPEG, PNG, or WebP up to 10 MB. Photography tips help you avoid the common pitfalls: coloured lighting, filters, shadows, glasses.",
  },
  {
    title: "3 — Image-quality validation",
    body: "The backend verifies the file is a genuine image, corrects orientation, and checks: exactly one clearly visible face, face size, head pose (yaw, pitch, roll), sharpness, exposure, lighting balance across the face, and colour casts. You get a 0–100 quality score with specific retake tips — a poor photo is rejected before it can produce a misleading result.",
  },
  {
    title: "4 — Skin-region extraction",
    body: "MediaPipe facial landmarks locate your central forehead and both cheeks. Elliptical regions are drawn relative to your facial geometry — never fixed pixel boxes — and pixels that are too dark, too bright, specular highlights, or statistical outliers are filtered out.",
  },
  {
    title: "5 — Colour science",
    body: "The remaining skin pixels are aggregated robustly (median and trimmed mean) and converted through documented colour mathematics: sRGB → linear RGB → CIE XYZ (D65) → CIE Lab, plus HSV, HEX, chroma, and hue angle.",
  },
  {
    title: "6 — Undertone and season",
    body: "A rule-based classifier scores warmth versus coolness from hue angle and b* values, then places you on four dimensions — temperature, value, chroma, contrast — and matches them against season prototypes. A sub-season is shown only when confidence is high enough.",
  },
  {
    title: "7 — Confidence and explanation",
    body: "Classification and confidence are separate numbers. Confidence reflects image quality, region agreement, usable skin area, and how decisively one season won. Every result lists its evidence in plain language and tells you how to improve a future scan.",
  },
  {
    title: "8 — Palettes and products",
    body: "Your season maps to curated fashion palettes (including hijab-friendly tones), cosmetic colour directions, and product recommendations ranked by CIEDE2000 colour distance to your palette.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6">
      <Badge variant="secondary">Transparent by design</Badge>
      <h1 className="font-heading mt-4 text-4xl font-semibold tracking-tight">How it works</h1>
      <p className="text-muted-foreground mt-4 max-w-2xl leading-relaxed">
        {`Every step is deterministic and documented — the same photo with the same settings always
        produces the same result. Here is the complete journey from photo to palette.`}
      </p>

      <ol className="mt-10 space-y-4">
        {stages.map((stage) => (
          <li key={stage.title}>
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg">{stage.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">{stage.body}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>

      <div className="bg-secondary/50 mt-10 rounded-xl border p-6">
        <h2 className="font-heading text-lg font-semibold">Honest limitations</h2>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          Results vary with camera sensors, compression, white balance, lighting colour, makeup, and
          filters. The engine is a styling aid built on colour science — not a medical device, not
          biometric identification, and not a replacement for a professional colour consultant. When
          the system is unsure, it says so.
        </p>
        <Button className="mt-4" render={<Link href="/analysis" />}>
          Try it yourself
        </Button>
      </div>
    </div>
  );
}
