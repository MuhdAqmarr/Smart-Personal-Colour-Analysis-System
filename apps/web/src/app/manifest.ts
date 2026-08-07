import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";

// Web App Manifest — makes the app installable (PWA) with a proper icon.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} — Smart Personal Colour Analysis`,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#f9fafb",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
