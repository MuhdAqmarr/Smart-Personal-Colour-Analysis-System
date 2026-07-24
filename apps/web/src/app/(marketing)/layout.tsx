import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PageBack } from "@/components/navigation/page-back";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <PageBack
          fallbackHref="/"
          hideOn={["/", "/analysis"]}
          className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6"
        />
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
