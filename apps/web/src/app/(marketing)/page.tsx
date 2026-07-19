import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Lock,
  ScanFace,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { ColourChip } from "@/components/design-system/colour-chip";
import { SectionHeading } from "@/components/design-system/section-heading";
import { SwatchGrid } from "@/components/colour/swatch-grid";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { landingFaqs } from "@/lib/faq";
import { seasonPreviews } from "@/lib/seasons-preview";
import { siteConfig } from "@/lib/site";

const steps = [
  {
    icon: Camera,
    title: "Capture or upload",
    body: "Take a photo with your camera or upload one. Clear guidance helps you get lighting and framing right.",
  },
  {
    icon: ShieldCheck,
    title: "Automatic quality check",
    body: "The image is checked for a single visible face, sharpness, exposure, lighting balance, and colour casts before anything else happens.",
  },
  {
    icon: ScanFace,
    title: "Skin-region analysis",
    body: "Facial landmarks locate your forehead and cheeks; robust statistics extract representative skin colours in the CIE Lab colour space.",
  },
  {
    icon: Sparkles,
    title: "Your colour profile",
    body: "A rule-based engine estimates your undertone and colour season, explains its reasoning, and shows how confident it is.",
  },
];

const seasonTints: Record<string, string> = {
  spring: "var(--season-spring)",
  summer: "var(--season-summer)",
  autumn: "var(--season-autumn)",
  winter: "var(--season-winter)",
};

const heroSwatches = [
  { name: "Terracotta", hex: "#c66b3d" },
  { name: "Rust", hex: "#b7410e" },
  { name: "Mustard", hex: "#cc9c33" },
  { name: "Olive", hex: "#737c3f" },
  { name: "Warm Teal", hex: "#2f6f7e" },
  { name: "Burnt Orange", hex: "#cc5500" },
  { name: "Camel", hex: "#b0885a" },
  { name: "Moss", hex: "#5c6b3c" },
];

export default function HomePage() {
  return (
    <>
      {/* Hero -------------------------------------------------------- */}
      <section className="wash-page relative overflow-hidden">
        <div className="mx-auto grid w-full max-w-6xl gap-14 px-4 pb-20 pt-16 sm:px-6 md:grid-cols-[1.05fr_0.95fr] md:items-center md:pb-28 md:pt-24">
          <div className="max-w-xl space-y-6">
            <p className="text-eyebrow text-muted-foreground">
              Rule-based colour science — honest, explainable results
            </p>
            <h1 className="text-display text-balance">
              Find the colours that were made for you
            </h1>
            <p className="text-muted-foreground max-w-prose text-lg leading-relaxed">
              {siteConfig.name} analyses a single facial photo to estimate your undertone and
              seasonal colour palette — then translates it into outfits, cosmetics, and products you
              can actually shop.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button size="lg" render={<Link href="/analysis" />}>
                Start your analysis
              </Button>
              <Button size="lg" variant="ghost" render={<Link href="/how-it-works" />}>
                See how it works
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">
              Free to try as a guest. No image is stored unless you choose to save it.
            </p>
          </div>

          {/* Product demonstration: an example result card with layered
              palette panels — real UI abstraction, no stock imagery. */}
          <div className="relative mx-auto hidden w-full max-w-sm md:block" aria-hidden="true">
            <div className="bg-card ring-border absolute -left-10 top-6 w-52 -rotate-6 rounded-2xl p-4 opacity-80 shadow-xs ring-1">
              <p className="text-muted-foreground mb-2.5 text-xs font-medium">Summer</p>
              <div className="grid grid-cols-4 gap-1.5">
                {seasonPreviews
                  .find((season) => season.slug === "summer")!
                  .swatches.slice(0, 8)
                  .map((swatch) => (
                    <ColourChip key={swatch.hex} hex={swatch.hex} size="sm" className="w-full" />
                  ))}
              </div>
            </div>
            <div className="bg-card ring-border absolute -right-6 bottom-2 w-48 rotate-3 rounded-2xl p-4 opacity-80 shadow-xs ring-1">
              <p className="text-muted-foreground mb-2.5 text-xs font-medium">Spring</p>
              <div className="grid grid-cols-4 gap-1.5">
                {seasonPreviews
                  .find((season) => season.slug === "spring")!
                  .swatches.slice(0, 8)
                  .map((swatch) => (
                    <ColourChip key={swatch.hex} hex={swatch.hex} size="sm" className="w-full" />
                  ))}
              </div>
            </div>

            <div
              className="glass-result wash-season relative rounded-3xl p-6"
              style={{ "--season-tint": "var(--season-autumn)" } as React.CSSProperties}
            >
              <p className="text-eyebrow text-muted-foreground">Example result</p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.015em]">Soft Autumn</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Warm undertone · muted, earthy depth
              </p>
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="tabular-nums">High · 82%</span>
                </div>
                <div className="bg-surface-strong mt-1.5 h-1.5 overflow-hidden rounded-full">
                  <div className="bg-foreground/70 h-full w-[82%] rounded-full" />
                </div>
              </div>
              <div className="mt-5 grid grid-cols-4 gap-2">
                {heroSwatches.map((swatch) => (
                  <ColourChip key={swatch.hex} hex={swatch.hex} className="aspect-square w-full" />
                ))}
              </div>
              <p className="text-muted-foreground mt-5 text-xs leading-relaxed">
                “Skin tone shows warm, golden undertones with softened contrast…”
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works ------------------------------------------------- */}
      <section aria-labelledby="how-heading" className="border-separator border-t">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 md:py-24">
          <SectionHeading
            id="how-heading"
            eyebrow="How it works"
            title="How the analysis works"
            lede="Four transparent steps — no black boxes, no inflated claims. Every result explains the evidence behind it."
          />
          <ol className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title} className="border-border border-t pt-5">
                <p className="text-muted-foreground font-mono text-xs tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 flex items-center gap-2 text-base font-semibold">
                  <step.icon className="text-muted-foreground size-4" aria-hidden="true" />
                  {step.title}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Four seasons -------------------------------------------------- */}
      <section aria-labelledby="seasons-heading" className="bg-surface border-separator border-y">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 md:py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              id="seasons-heading"
              eyebrow="Colour seasons"
              title="The four colour seasons"
              lede="Seasonal colour analysis groups personal colouring by temperature, depth, clarity, and contrast. Your season comes with twelve sub-seasons for finer nuance."
            />
            <Button variant="outline" render={<Link href="/seasons" />}>
              Explore all seasons
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {seasonPreviews.map((season) => (
              <article
                key={season.slug}
                className="wash-season ring-border rounded-2xl p-6 ring-1"
                style={{ "--season-tint": seasonTints[season.slug] } as React.CSSProperties}
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-title-3">{season.name}</h3>
                  <p className="text-muted-foreground text-sm">{season.tagline}</p>
                </div>
                <div className="mt-5 flex gap-2">
                  {season.swatches.slice(0, 6).map((swatch) => (
                    <ColourChip
                      key={swatch.hex}
                      hex={swatch.hex}
                      className="aspect-square w-full max-w-12"
                    />
                  ))}
                </div>
                <p className="text-muted-foreground mt-5 text-sm leading-relaxed">
                  {season.summary}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Wardrobe palette ---------------------------------------------- */}
      <section aria-labelledby="fashion-heading">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-2 md:py-24">
          <SectionHeading
            id="fashion-heading"
            eyebrow="Fashion"
            title="A wardrobe palette, not just a label"
            lede="Your season unlocks a curated palette organised the way you dress: neutrals, core colours, accents, formal wear, casual wear, accessories, and hijab or headwear tones — plus colours to use cautiously, with gentler alternatives suggested."
          />
          <div>
            <div className="bg-card ring-border rounded-2xl p-6 shadow-xs ring-1">
              <p className="mb-4 text-sm font-semibold">Autumn — core colours</p>
              <SwatchGrid
                swatches={[
                  { name: "Terracotta", hex: "#c66b3d" },
                  { name: "Rust", hex: "#b7410e" },
                  { name: "Mustard", hex: "#cc9c33" },
                  { name: "Olive", hex: "#737c3f" },
                  { name: "Warm Teal", hex: "#2f6f7e" },
                  { name: "Burnt Orange", hex: "#cc5500" },
                ]}
                showLabels
              />
            </div>
            <ul className="text-muted-foreground mt-6 space-y-2.5 text-sm">
              {[
                "Copy exact HEX codes for online shopping",
                "Save favourite colours to your account",
                "Print or download a palette card for the fitting room",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2
                    className="text-success mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Cosmetics + products ------------------------------------------ */}
      <section
        aria-labelledby="cosmetics-heading"
        className="bg-surface border-separator border-y"
      >
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-2 md:py-24">
          <div className="space-y-10">
            <SectionHeading
              id="cosmetics-heading"
              eyebrow="Cosmetics"
              title="Cosmetic shades that work with you"
              lede="Lipstick, blusher, eyeshadow, eyeliner, and highlighter suggestions tuned to your season — each with intensity and day-or-evening guidance. Foundation advice stays honest: we point you to a warm, cool, or neutral direction and always recommend testing in daylight."
            />
            <div className="bg-card ring-border rounded-2xl p-6 shadow-xs ring-1">
              <p className="mb-4 text-sm font-semibold">Winter — cosmetic direction</p>
              <SwatchGrid
                swatches={[
                  { name: "True Red lip", hex: "#c0143c" },
                  { name: "Cool Berry blush", hex: "#ab5070" },
                  { name: "Icy Silver lid", hex: "#d5dbe4" },
                  { name: "Cool Plum crease", hex: "#6b4a75" },
                  { name: "Jet Black liner", hex: "#17171a" },
                  { name: "Icy Pearl glow", hex: "#e9eef5" },
                ]}
                showLabels
              />
            </div>
          </div>

          <div className="space-y-10">
            <SectionHeading
              id="products-heading"
              eyebrow="Products"
              title="From palette to products"
              lede="Every product in the directory carries measured colour data. We rank matches for your palette using the CIEDE2000 colour-difference formula — the same maths used in colour-critical industries — then link you to the store to buy."
            />
            <div className="bg-card ring-border rounded-2xl p-6 shadow-xs ring-1">
              <dl className="space-y-4 text-sm">
                {[
                  ["Palette proximity", "How close the product colour sits to your best colours"],
                  ["Season match", "Whether the product is tagged for your season"],
                  ["Category fit", "Clothing, hijab, accessory, or cosmetic relevance"],
                  ["Availability", "In-stock items rank higher"],
                ].map(([term, description]) => (
                  <div
                    key={term}
                    className="border-separator flex items-start justify-between gap-6 border-b pb-3 last:border-b-0 last:pb-0"
                  >
                    <dt className="shrink-0 font-medium">{term}</dt>
                    <dd className="text-muted-foreground text-right">{description}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-muted-foreground mt-5 text-xs leading-relaxed">
                Product photos can differ from real-world colour; purchases always happen on the
                external store.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy ------------------------------------------------------- */}
      <section aria-labelledby="privacy-heading">
        <div className="mx-auto w-full max-w-2xl px-4 py-20 text-center sm:px-6 md:py-24">
          <span className="bg-secondary text-foreground mx-auto flex size-11 items-center justify-center rounded-xl">
            <Lock className="size-5" aria-hidden="true" />
          </span>
          <h2 id="privacy-heading" className="text-title-1 mt-5 text-balance">
            Private by default
          </h2>
          <p className="text-muted-foreground mt-4 leading-relaxed">
            Your photo is analysed in memory and discarded — it is never stored unless you are
            signed in and explicitly tick “save my analysis image”. Saved images live in a private
            bucket only you can access, and you can delete them, any analysis, or your whole account
            at any time. No identity recognition is ever performed.
          </p>
          <Button variant="outline" className="mt-7" render={<Link href="/privacy" />}>
            Read the privacy policy
          </Button>
        </div>
      </section>

      {/* FAQ ----------------------------------------------------------- */}
      <section aria-labelledby="faq-heading" className="bg-surface border-separator border-y">
        <div className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-6 md:py-24">
          <SectionHeading id="faq-heading" title="Frequently asked questions" centred />
          <Accordion className="mt-10">
            {landingFaqs.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <p className="text-muted-foreground mt-8 text-center text-sm">
            More questions answered on the{" "}
            <Link
              href="/faq"
              className="text-foreground underline underline-offset-4 transition-colors"
            >
              full FAQ page
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Final CTA ------------------------------------------------------ */}
      <section aria-labelledby="cta-heading">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 md:py-24">
          <div className="bg-primary text-primary-foreground rounded-3xl px-6 py-14 text-center sm:px-12 md:py-16">
            <h2 id="cta-heading" className="text-title-1 text-balance">
              Ready to meet your colours?
            </h2>
            <p className="text-primary-foreground/75 mx-auto mt-4 max-w-xl leading-relaxed">
              The analysis takes about a minute. Try it as a guest first — create an account only
              when you want to save your results.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                render={<Link href="/analysis" />}
              >
                Start your analysis
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                render={<Link href="/register" />}
              >
                Create an account
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
