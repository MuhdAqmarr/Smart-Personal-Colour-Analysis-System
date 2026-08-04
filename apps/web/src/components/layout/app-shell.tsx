import { SiteHeader } from "@/components/layout/site-header";
import { MemberBottomNav, MemberSidebar } from "@/components/layout/member-nav";
import { PageBack } from "@/components/navigation/page-back";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-10 px-4 py-8 sm:px-6">
        <MemberSidebar />
        <main id="main-content" className="min-w-0 flex-1 pb-20 md:pb-0">
          <PageBack fallbackHref="/dashboard" hideOn={["/dashboard"]} />
          {children}
        </main>
      </div>
      <MemberBottomNav />
    </div>
  );
}
