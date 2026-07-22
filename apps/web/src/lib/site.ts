/**
 * Site-wide configuration. The product name is intentionally configurable
 * (master spec §2.1) — change it here or via NEXT_PUBLIC_APP_NAME without
 * refactoring.
 */
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "Match.Lab",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  description:
    "Analyse a facial photo to receive an estimated undertone, a suggested colour season, personal fashion and cosmetic palettes, and colour-matched product ideas. A rule-based styling tool — not a medical or biometric system.",
} as const;

export const mainNav = [
  { title: "How it works", href: "/how-it-works" },
  { title: "Colour seasons", href: "/seasons" },
  { title: "Products", href: "/products" },
  { title: "FAQ", href: "/faq" },
] as const;

export const footerNav = {
  product: [
    { title: "How it works", href: "/how-it-works" },
    { title: "Colour seasons", href: "/seasons" },
    { title: "Start an analysis", href: "/analysis" },
    { title: "Product directory", href: "/products" },
    { title: "FAQ", href: "/faq" },
  ],
  legal: [
    { title: "Privacy policy", href: "/privacy" },
    { title: "Terms of use", href: "/terms" },
    { title: "Analysis disclaimer", href: "/disclaimer" },
  ],
} as const;
