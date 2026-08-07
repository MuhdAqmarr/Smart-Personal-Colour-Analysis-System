import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Prototype",
  description:
    "MatchLab high-fidelity prototype screens (mobile & desktop) — preview and download for reports.",
  // Unlisted utility page: keep it out of search engines.
  robots: { index: false, follow: false },
};

const ASSET_DIR = "/prototype-screens";
const ZIP = `${ASSET_DIR}/MatchLab-Prototype-Screens.zip`;

const SCREENS = [
  { id: "01", slug: "Landing", title: "Landing" },
  { id: "02", slug: "SignIn", title: "Sign in" },
  { id: "03", slug: "Consent", title: "Consent" },
  { id: "04", slug: "Scan", title: "Scan / Upload" },
  { id: "05", slug: "Result", title: "Result" },
  { id: "06", slug: "Palette", title: "Colour palette" },
  { id: "07", slug: "Shop", title: "Shop palette" },
  { id: "08", slug: "Products", title: "Products" },
] as const;

const DIMS = {
  mobile: { w: 708, h: 1401 },
  desktop: { w: 1800, h: 1245 },
} as const;

function file(id: string, slug: string, device: "mobile" | "desktop") {
  return `${ASSET_DIR}/MatchLab-${id}-${slug}-${device}.png`;
}

function ScreenCard({
  id,
  slug,
  title,
  device,
}: {
  id: string;
  slug: string;
  title: string;
  device: "mobile" | "desktop";
}) {
  const src = file(id, slug, device);
  const name = `MatchLab-${id}-${slug}-${device}.png`;
  const { w, h } = DIMS[device];
  return (
    <figure className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-3">
      <a
        href={src}
        download={name}
        className="border-border bg-muted focus-visible:ring-ring block overflow-hidden rounded-xl border focus-visible:outline-none focus-visible:ring-2"
        aria-label={`Download ${title} (${device})`}
      >
        <Image
          src={src}
          width={w}
          height={h}
          sizes="(min-width: 1024px) 300px, 45vw"
          className="h-auto w-full"
          alt={`${title} screen — ${device}`}
        />
      </a>
      <figcaption className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">
          <span className="text-muted-foreground tabular-nums">{id}</span> {title}
        </span>
        <Button variant="outline" size="sm" render={<a href={src} download={name} />}>
          Download
        </Button>
      </figcaption>
    </figure>
  );
}

export default function PrototypePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            aria-label={`${siteConfig.name} home`}
          >
            <Image src="/logo.png" alt="" width={40} height={40} className="size-10 shrink-0" />
            <span className="text-[1.0625rem] font-semibold tracking-[-0.01em]">
              {siteConfig.name}
            </span>
          </Link>
          <span className="border-border text-muted-foreground rounded-full border px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.14em]">
            Prototype
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Prototype screens</h1>
          <p className="text-muted-foreground max-w-2xl leading-relaxed">
            High-fidelity screens of the {siteConfig.name} experience, in mobile and desktop. Click
            any screen — or its Download button — to save the PNG. These are design mockups for
            documentation, not live screenshots.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button render={<a href={ZIP} download />}>Download all (ZIP)</Button>
            <span className="text-muted-foreground text-sm">
              {SCREENS.length} screens × mobile &amp; desktop · {SCREENS.length * 2} PNGs
            </span>
          </div>
        </div>
      </header>

      <section className="mt-12" aria-labelledby="mobile-heading">
        <h2 id="mobile-heading" className="mb-5 text-lg font-semibold">
          Mobile
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {SCREENS.map((s) => (
            <ScreenCard key={`m-${s.id}`} {...s} device="mobile" />
          ))}
        </div>
      </section>

      <section className="mt-12" aria-labelledby="desktop-heading">
        <h2 id="desktop-heading" className="mb-5 text-lg font-semibold">
          Desktop
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SCREENS.map((s) => (
            <ScreenCard key={`d-${s.id}`} {...s} device="desktop" />
          ))}
        </div>
      </section>

      <footer className="border-border text-muted-foreground mt-14 border-t pt-6 text-xs leading-relaxed">
        <p>
          {siteConfig.name} is a rule-based styling and educational tool — results are estimates,
          not medical, dermatological, or biometric claims. These prototype mockups are for the
          Final Year Project report.
        </p>
      </footer>
    </div>
  );
}
