"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ExternalLink,
  FileUp,
  LayoutDashboard,
  Package,
  Palette,
  ScrollText,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Store,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { ThemeToggle } from "@/components/design-system/theme-toggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getMe } from "@/lib/api/admin";
import { siteConfig } from "@/lib/site";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const adminNav = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Products", href: "/admin/products", icon: Package },
  { title: "Stores", href: "/admin/stores", icon: Store },
  { title: "Palettes", href: "/admin/palettes", icon: Palette },
  { title: "Cosmetics", href: "/admin/cosmetics", icon: Sparkles },
  { title: "CSV import", href: "/admin/imports", icon: FileUp },
  { title: "Audit log", href: "/admin/audit", icon: ScrollText },
  { title: "Settings", href: "/admin/settings", icon: Settings2 },
];

/**
 * Dedicated administration chrome, fully separate from the member AppShell.
 * Client-side role gate for UX only — every /api/v1/admin endpoint re-checks
 * the role against the database on the server.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const me = useQuery({ queryKey: ["me"], queryFn: getMe, staleTime: 60_000, retry: false });

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const navLink = (item: (typeof adminNav)[number], mobile = false) => {
    const active =
      pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "text-muted-foreground hover:text-foreground duration-(--motion-fast) flex items-center gap-2.5 whitespace-nowrap rounded-lg text-sm font-medium transition-colors",
          mobile ? "px-3 py-1.5" : "px-3 py-2",
          active ? "bg-card text-foreground ring-border shadow-xs ring-1" : "hover:bg-muted/60",
        )}
      >
        <item.icon
          className={cn("size-4", active ? "text-foreground" : "text-muted-foreground")}
          aria-hidden="true"
        />
        {item.title}
      </Link>
    );
  };

  return (
    <div className="flex min-h-svh flex-col">
      <header className="glass-navigation sticky top-0 z-40 border-b">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2.5" aria-label="Admin console home">
            <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-[10px]">
              <ShieldCheck className="size-4" aria-hidden="true" />
            </span>
            <span className="text-[1.0625rem] font-semibold tracking-[-0.01em]">
              {siteConfig.name}
            </span>
            <span className="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-xs font-medium">
              Admin
            </span>
          </Link>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Button variant="ghost" size="sm" render={<Link href="/" />}>
              <ExternalLink className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">View site</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {me.isPending ? (
        <div
          className="mx-auto w-full max-w-6xl flex-1 space-y-4 px-4 py-8 sm:px-6"
          aria-label="Checking access"
        >
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : me.isError || me.data.role !== "admin" ? (
        <div className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:px-6">
          <Alert>
            <ShieldAlert aria-hidden="true" />
            <AlertTitle>Administrator access required</AlertTitle>
            <AlertDescription>
              <p>
                This area manages the public catalogue and system settings. Your account does not
                have the administrator role.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                render={<Link href="/dashboard" />}
              >
                Back to your dashboard
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-6xl flex-1 gap-10 px-4 py-8 sm:px-6">
          <aside className="hidden w-56 shrink-0 md:block">
            <nav aria-label="Admin sections" className="top-22 sticky space-y-0.5">
              {adminNav.map((item) => navLink(item))}
            </nav>
          </aside>

          <main id="main-content" className="min-w-0 flex-1">
            <nav
              aria-label="Admin sections"
              className="bg-surface-strong scrollbar-none -mx-1 mb-6 flex w-fit max-w-full items-center gap-0.5 overflow-x-auto rounded-lg p-[3px] md:hidden"
            >
              {adminNav.map((item) => navLink(item, true))}
            </nav>
            {children}
          </main>
        </div>
      )}
    </div>
  );
}
