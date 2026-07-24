import { Palette } from "lucide-react";
import Link from "next/link";

import { PageBack } from "@/components/navigation/page-back";
import { siteConfig } from "@/lib/site";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="wash-page flex min-h-svh flex-col">
      <header className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5"
          aria-label={`${siteConfig.name} home`}
        >
          <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-[10px]">
            <Palette className="size-4" aria-hidden="true" />
          </span>
          <span className="text-[1.0625rem] font-semibold tracking-[-0.01em]">
            {siteConfig.name}
          </span>
        </Link>
      </header>
      <main id="main-content" className="flex flex-1 items-center justify-center px-4 pb-20">
        <div className="w-full max-w-md">
          <PageBack fallbackHref="/" />
          {children}
        </div>
      </main>
    </div>
  );
}
