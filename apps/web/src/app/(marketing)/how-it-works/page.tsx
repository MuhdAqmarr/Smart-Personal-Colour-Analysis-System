import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "The full pipeline behind the analysis: quality checks, facial landmarks, CIE Lab colour science, and a rule-based season classifier.",
};

const stages = [
  {
    title: "Consent first",
    body: "Before anything happens you see exactly why a photo is needed, which facial regions are analysed, what is (and is not) stored, and how deletion works. Analysis only starts after you agree.",
  },
  {
    title: "Photo capture or upload",
    body: "Use your device camera (front camera on phones, with an on-screen face guide) or upload a JPEG, PNG, or WebP up to 10 MB. Photography tips help you avoid the common pitfalls: coloured lighting, filters, shadows, glasses.",
  },
  {
    title: "Image-quality validation",
    body: "The backend verifies the file is a genuine image, corrects orientation, and checks: exactly one clearly visible face, face size, head pose (yaw, pitch, roll), sharpness, exposure, lighting balance across the face, and colour casts. You get a 0–100 quality score with specific retake tips — a poor photo is rejected before it can produce a misleading result.",
  },
  {
    title: "Skin-region extraction",
    body: "MediaPipe facial landmarks locate your central forehead and both cheeks. Elliptical regions are drawn relative to your facial geometry — never fixed pixel boxes — and pixels that are too dark, too bright, specular highlights, or statistical outliers are filtered out.",
  },
  {
    title: "Colour science",
    body: "The remaining skin pixels are aggregated robustly (median and trimmed mean) and converted through documented colour mathematics: sRGB → linear RGB → CIE XYZ (D65) → CIE Lab, plus HSV, HEX, chroma, and hue angle.",
  },
  {
    title: "Undertone and season",
    body: "A rule-based classifier scores warmth versus coolness from hue angle and b* values, then places you on four dimensions — temperature, value, chroma, contrast — and matches them against season prototypes. A sub-season is shown only when confidence is high enough.",
  },
  {
    title: "Confidence and explanation",
    body: "Classification and confidence are separate numbers. Confidence reflects image quality, region agreement, usable skin area, and how decisively one season won. Every result lists its evidence in plain language and tells you how to improve a future scan.",
  },
  {
    title: "Palettes and products",
    body: "Your season maps to curated fashion palettes (including hijab-friendly tones), cosmetic colour directions, and product recommendations ranked by CIEDE2000 colour distance to your palette.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-eyebrow text-muted-foreground">Transparent by design</p>
      <h1 className="text-title-1 mt-3">How it works</h1>
      <p className="text-muted-foreground mt-4 max-w-2xl leading-relaxed">
        {`Every step is deterministic and documented — the same photo with the same settings always
        produces the same result. Here is the complete journey from photo to palette.`}
      </p>

      <ol className="border-border mt-12 space-y-0 border-l pl-0">
        {stages.map((stage, index) => (
          <li key={stage.title} className="relative pb-10 pl-8 last:pb-0">
            <span
              aria-hidden="true"
              className="bg-card ring-border text-muted-foreground absolute -left-4 top-0 flex size-8 items-center justify-center rounded-full font-mono text-xs tabular-nums ring-1"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <h2 className="text-base font-semibold">{stage.title}</h2>
            <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{stage.body}</p>
          </li>
        ))}
      </ol>

      <div className="bg-surface ring-border mt-12 rounded-2xl p-6 ring-1 sm:p-8">
        <h2 className="text-title-3">Honest limitations</h2>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          Results vary with camera sensors, compression, white balance, lighting colour, makeup, and
          filters. The engine is a styling aid built on colour science — not a medical device, not
          biometric identification, and not a replacement for a professional colour consultant. When
          the system is unsure, it says so.
        </p>
        <Button className="mt-5" render={<Link href="/analysis" />}>
          Try it yourself
        </Button>
      </div>
    </div>
  );
}
