"use client";

import { useQuery } from "@tanstack/react-query";
import { Heart, History, LayoutDashboard, ScanFace, Settings, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { SiteHeader } from "@/components/layout/site-header";
import { getMe } from "@/lib/api/admin";
import { cn } from "@/lib/utils";

const appNav = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "New analysis", href: "/analysis", icon: ScanFace },
  { title: "Saved analyses", href: "/history", icon: History },
  { title: "Favourites", href: "/favourites", icon: Heart },
  { title: "Settings", href: "/settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const me = useQuery({ queryKey: ["me"], queryFn: getMe, staleTime: 60_000, retry: false });
  const nav =
    me.data?.role === "admin"
      ? [...appNav, { title: "Admin", href: "/admin", icon: ShieldCheck }]
      : appNav;

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-4 py-8 sm:px-6">
        <aside className="hidden w-52 shrink-0 md:block">
          <nav aria-label="Account navigation" className="sticky top-24 space-y-1">
            {nav.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active && "bg-muted text-foreground",
                  )}
                >
                  <item.icon className="size-4" aria-hidden="true" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main id="main-content" className="min-w-0 flex-1">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Account navigation"
        className="border-border/70 bg-background/95 sticky bottom-0 z-40 border-t backdrop-blur md:hidden"
      >
        <ul className="grid grid-cols-5">
          {nav.slice(0, 5).map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "text-muted-foreground flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-medium",
                    active && "text-primary",
                  )}
                >
                  <item.icon className="size-5" aria-hidden="true" />
                  {item.title.split(" ")[0]}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
