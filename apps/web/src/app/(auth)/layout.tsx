import { Palette } from "lucide-react";
import Link from "next/link";

import { siteConfig } from "@/lib/site";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-secondary/40 flex min-h-svh flex-col">
      <header className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2"
          aria-label={`${siteConfig.name} home`}
        >
          <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
            <Palette className="size-4" aria-hidden="true" />
          </span>
          <span className="font-heading text-lg font-semibold tracking-tight">
            {siteConfig.name}
          </span>
        </Link>
      </header>
      <main id="main-content" className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
