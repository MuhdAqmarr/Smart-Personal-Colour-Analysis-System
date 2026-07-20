import { Palette } from "lucide-react";
import Link from "next/link";

import { footerNav, siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-separator bg-surface border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3 sm:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-[10px]">
                <Palette className="size-4" aria-hidden="true" />
              </span>
              <span className="text-[1.0625rem] font-semibold tracking-[-0.01em]">
                {siteConfig.name}
              </span>
            </div>
            <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
              A personal styling and educational tool built as a Final Year Project. Results are
              estimates from a rule-based colour-analysis engine and can vary with lighting and
              camera conditions.
            </p>
          </div>

          <nav aria-label="Product links">
            <h2 className="text-foreground/80 mb-3 text-[0.8125rem] font-semibold">Product</h2>
            <ul className="space-y-2.5">
              {footerNav.product.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground duration-(--motion-fast) text-sm transition-colors"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal links">
            <h2 className="text-foreground/80 mb-3 text-[0.8125rem] font-semibold">Legal</h2>
            <ul className="space-y-2.5">
              {footerNav.legal.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground duration-(--motion-fast) text-sm transition-colors"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="border-separator text-muted-foreground mt-12 border-t pt-6 text-xs leading-relaxed">
          <p>
            {siteConfig.name} is not a medical, dermatological, or biometric identification system.
            It never performs identity recognition, and facial images are not stored unless you
            explicitly choose to save them.
          </p>
          <p className="mt-2">Final Year Project — academic demonstration.</p>
        </div>
      </div>
    </footer>
  );
}
