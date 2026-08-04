"use client";

import { Heart, History, LayoutDashboard, ScanFace, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

// Shared member navigation, used by the AppShell and by the analysis wizard
// (which lives in the public shell so guests can use it, but shows this nav
// to signed-in members for a consistent experience).
export const memberNav = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "New analysis", href: "/analysis", icon: ScanFace },
  { title: "Saved analyses", href: "/history", icon: History },
  { title: "Favourites", href: "/favourites", icon: Heart },
  { title: "Settings", href: "/settings", icon: Settings },
];

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
}

/** Desktop sidebar (hidden below md). */
export function MemberSidebar({ className }: { className?: string }) {
  const isActive = useIsActive();
  return (
    <aside className={cn("hidden w-56 shrink-0 md:block", className)}>
      <nav aria-label="Account navigation" className="top-22 sticky space-y-0.5">
        {memberNav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "text-muted-foreground hover:text-foreground duration-(--motion-fast) flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-card text-foreground ring-border shadow-xs ring-1"
                  : "hover:bg-muted/60",
              )}
            >
              <item.icon
                className={cn("size-4", active ? "text-foreground" : "text-muted-foreground")}
                aria-hidden="true"
              />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

/** Mobile bottom navigation (hidden at md+). Fixed + safe-area aware. */
export function MemberBottomNav() {
  const isActive = useIsActive();
  return (
    <nav
      aria-label="Account navigation"
      className="glass-navigation fixed inset-x-0 bottom-0 z-40 border-t md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {memberNav.slice(0, 5).map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-muted-foreground duration-(--motion-fast) flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                  active && "text-foreground",
                )}
              >
                <span
                  className={cn(
                    "duration-(--motion-fast) flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                    active && "bg-secondary",
                  )}
                >
                  <item.icon className="size-5" aria-hidden="true" />
                </span>
                {item.title.split(" ")[0]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
