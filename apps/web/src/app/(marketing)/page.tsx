import {
  Camera,
  CheckCircle2,
  Lock,
  Palette,
  ScanFace,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  SwatchBook,
  Wand2,
} from "lucide-react";
import Link from "next/link";

import { SwatchGrid } from "@/components/colour/swatch-grid";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function HomePage() {
  return (
    <>
      {/* Hero -------------------------------------------------------- */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_30rem_at_70%_-10%,--alpha(var(--color-primary)/10%),transparent)]"
        />
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center md:py-24">
          <div className="space-y-6">
            <Badge variant="secondary" className="gap-1.5">
              <Wand2 className="size-3.5" aria-hidden="true" />
              Rule-based colour science — honest, explainable results
            </Badge>
            <h1 className="font-heading text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Find the colours that were made for you
            </h1>
            <p className="text-muted-foreground max-w-prose text-lg leading-relaxed">
              {siteConfig.name} analyses a single facial photo to estimate your undertone and
              seasonal colour palette — then translates it into outfits, cosmetics, and products you
              can actually shop.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" render={<Link href="/analysis" />}>
                Start your analysis
              </Button>
              <Button size="lg" variant="outline" render={<Link href="/how-it-works" />}>
                See how it works
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">
              Free to try as a guest. No image is stored unless you choose to save it.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4" aria-hidden="true">
            {seasonPreviews.map((season) => (
              <div
                key={season.slug}
                className="bg-card shadow-xs rounded-xl border p-4 transition-transform motion-safe:hover:-translate-y-0.5"
              >
                <p className="font-heading mb-3 text-sm font-semibold">{season.name}</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {season.swatches.slice(0, 6).map((swatch) => (
                    <span
                      key={swatch.hex}
                      className="aspect-square rounded-md border border-black/5"
                      style={{ backgroundColor: swatch.hex }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works ------------------------------------------------- */}
      <section className="bg-secondary/40 border-y" aria-labelledby="how-heading">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-10 max-w-2xl">
            <h2 id="how-heading" className="font-heading text-3xl font-semibold tracking-tight">
              How the analysis works
            </h2>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              Four transparent steps — no black boxes, no inflated claims. Every result explains the
              evidence behind it.
            </p>
          </div>
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title}>
                <Card className="h-full">
                  <CardHeader>
                    <span className="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-lg">
                      <step.icon className="size-5" aria-hidden="true" />
                    </span>
                    <CardTitle className="font-heading text-lg">
                      <span className="text-muted-foreground mr-2 text-sm tabular-nums">
                        {index + 1}.
                      </span>
                      {step.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm leading-relaxed">{step.body}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Four seasons -------------------------------------------------- */}
      <section aria-labelledby="seasons-heading">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h2
                id="seasons-heading"
                className="font-heading text-3xl font-semibold tracking-tight"
              >
                The four colour seasons
              </h2>
              <p className="text-muted-foreground mt-3 leading-relaxed">
                Seasonal colour analysis groups personal colouring by temperature, depth, clarity,
                and contrast. Your season comes with twelve sub-seasons for finer nuance.
              </p>
            </div>
            <Button variant="outline" render={<Link href="/seasons" />}>
              Explore all seasons
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {seasonPreviews.map((season) => (
              <Card key={season.slug}>
                <CardHeader>
                  <CardTitle className="font-heading text-xl">{season.name}</CardTitle>
                  <CardDescription>{season.tagline}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SwatchGrid swatches={season.swatches} />
                  <p className="text-muted-foreground text-sm leading-relaxed">{season.summary}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Fashion palette ----------------------------------------------- */}
      <section className="bg-secondary/40 border-y" aria-labelledby="fashion-heading">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2">
          <div className="space-y-4">
            <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
              <SwatchBook className="size-5" aria-hidden="true" />
            </span>
            <h2 id="fashion-heading" className="font-heading text-3xl font-semibold tracking-tight">
              A wardrobe palette, not just a label
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Your season unlocks a curated palette organised the way you dress: neutrals, core
              colours, accents, formal wear, casual wear, accessories, and hijab or headwear tones —
              plus colours to use cautiously, with gentler alternatives suggested.
            </p>
            <ul className="text-muted-foreground space-y-2 text-sm">
              {[
                "Copy exact HEX codes for online shopping",
                "Save favourite colours to your account",
                "Print or download a palette card for the fitting room",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2
                    className="text-primary mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-card shadow-xs rounded-xl border p-6">
            <p className="font-heading mb-4 text-sm font-semibold">Autumn — core colours</p>
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
        </div>
      </section>

      {/* Cosmetics ----------------------------------------------------- */}
      <section aria-labelledby="cosmetics-heading">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2">
          <div className="bg-card shadow-xs order-last rounded-xl border p-6 md:order-first">
            <p className="font-heading mb-4 text-sm font-semibold">Winter — cosmetic direction</p>
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
          <div className="space-y-4">
            <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
              <Palette className="size-5" aria-hidden="true" />
            </span>
            <h2
              id="cosmetics-heading"
              className="font-heading text-3xl font-semibold tracking-tight"
            >
              Cosmetic shades that work with you
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Lipstick, blusher, eyeshadow, eyeliner, and highlighter suggestions tuned to your
              season — each with intensity and day-or-evening guidance. Foundation advice stays
              honest: we point you to a warm, cool, or neutral direction and always recommend
              testing in daylight.
            </p>
          </div>
        </div>
      </section>

      {/* Products ------------------------------------------------------ */}
      <section className="bg-secondary/40 border-y" aria-labelledby="products-heading">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="space-y-4">
              <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                <ShoppingBag className="size-5" aria-hidden="true" />
              </span>
              <h2
                id="products-heading"
                className="font-heading text-3xl font-semibold tracking-tight"
              >
                From palette to products
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Every product in the directory carries measured colour data. We rank matches for
                your palette using the CIEDE2000 colour-difference formula — the same maths used in
                colour-critical industries — then link you to the store to buy.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Product photos can differ from real-world colour; purchases always happen on the
                external store.
              </p>
            </div>
            <div className="bg-card shadow-xs rounded-xl border p-6">
              <dl className="space-y-3 text-sm">
                {[
                  ["Palette proximity", "How close the product colour sits to your best colours"],
                  ["Season match", "Whether the product is tagged for your season"],
                  ["Category fit", "Clothing, hijab, accessory, or cosmetic relevance"],
                  ["Availability", "In-stock items rank higher"],
                ].map(([term, description]) => (
                  <div key={term} className="flex items-start justify-between gap-4">
                    <dt className="font-medium">{term}</dt>
                    <dd className="text-muted-foreground text-right">{description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy ------------------------------------------------------- */}
      <section aria-labelledby="privacy-heading">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6">
          <span className="bg-primary/10 text-primary mx-auto flex size-12 items-center justify-center rounded-xl">
            <Lock className="size-6" aria-hidden="true" />
          </span>
          <h2
            id="privacy-heading"
            className="font-heading mt-4 text-3xl font-semibold tracking-tight"
          >
            Private by default
          </h2>
          <p className="text-muted-foreground mt-4 leading-relaxed">
            Your photo is analysed in memory and discarded — it is never stored unless you are
            signed in and explicitly tick “save my analysis image”. Saved images live in a private
            bucket only you can access, and you can delete them, any analysis, or your whole account
            at any time. No identity recognition is ever performed.
          </p>
          <Button variant="outline" className="mt-6" render={<Link href="/privacy" />}>
            Read the privacy policy
          </Button>
        </div>
      </section>

      {/* FAQ ----------------------------------------------------------- */}
      <section className="bg-secondary/40 border-y" aria-labelledby="faq-heading">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
          <h2
            id="faq-heading"
            className="font-heading mb-8 text-center text-3xl font-semibold tracking-tight"
          >
            Frequently asked questions
          </h2>
          <Accordion>
            {landingFaqs.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <p className="text-muted-foreground mt-6 text-center text-sm">
            More questions answered on the{" "}
            <Link href="/faq" className="text-primary underline underline-offset-4">
              full FAQ page
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Final CTA ------------------------------------------------------ */}
      <section aria-labelledby="cta-heading">
        <div className="mx-auto w-full max-w-4xl px-4 py-20 text-center sm:px-6">
          <h2 id="cta-heading" className="font-heading text-3xl font-semibold tracking-tight">
            Ready to meet your colours?
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-xl leading-relaxed">
            The analysis takes about a minute. Try it as a guest first — create an account only when
            you want to save your results.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" render={<Link href="/analysis" />}>
              Start your analysis
            </Button>
            <Button size="lg" variant="ghost" render={<Link href="/register" />}>
              Create an account
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
