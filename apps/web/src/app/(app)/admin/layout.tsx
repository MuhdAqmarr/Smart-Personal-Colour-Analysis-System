"use client";

import { useQuery } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getMe } from "@/lib/api/admin";
import { cn } from "@/lib/utils";

const adminNav = [
  { title: "Dashboard", href: "/admin" },
  { title: "Products", href: "/admin/products" },
  { title: "Stores", href: "/admin/stores" },
  { title: "Palettes", href: "/admin/palettes" },
  { title: "Cosmetics", href: "/admin/cosmetics" },
  { title: "CSV import", href: "/admin/imports" },
  { title: "Audit log", href: "/admin/audit" },
  { title: "Settings", href: "/admin/settings" },
];

/**
 * Client-side admin gate for UX only — every /api/v1/admin endpoint
 * re-checks the role against the database on the server.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const me = useQuery({ queryKey: ["me"], queryFn: getMe });

  if (me.isPending) {
    return (
      <div className="space-y-4" aria-label="Checking access">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (me.isError || me.data.role !== "admin") {
    return (
      <div className="mx-auto max-w-lg py-10">
        <Alert>
          <ShieldAlert aria-hidden="true" />
          <AlertTitle>Administrator access required</AlertTitle>
          <AlertDescription>
            <p>
              This area manages the public catalogue and system settings. Your account does not have
              the administrator role.
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
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-eyebrow text-muted-foreground">Administration</p>
        <nav
          aria-label="Admin sections"
          className="bg-surface-strong scrollbar-none -mx-1 flex w-fit max-w-full items-center gap-0.5 overflow-x-auto rounded-lg p-[3px]"
        >
          {adminNav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-muted-foreground hover:text-foreground duration-(--motion-fast) whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active && "bg-card text-foreground shadow-xs",
                )}
              >
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>
      {children}
    </div>
  );
}
