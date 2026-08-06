import Image from "next/image";
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
          <Image
            src="/logo.png"
            alt=""
            width={36}
            height={36}
            className="size-9 shrink-0"
            priority
          />
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
