"use client";

import { usePathname } from "next/navigation";

import { BackButton } from "@/components/navigation/back-button";
import { cn } from "@/lib/utils";

/**
 * Renders a page-level Back button, except on "home" routes where going back
 * is meaningless (passed via `hideOn`). Placed at the top of each layout's
 * content so every page has consistent back navigation.
 */
export function PageBack({
  fallbackHref = "/",
  hideOn = [],
  className,
}: {
  fallbackHref?: string;
  hideOn?: string[];
  className?: string;
}) {
  const pathname = usePathname();
  if (hideOn.includes(pathname)) return null;
  return (
    <div className={cn("mb-4", className)}>
      <BackButton fallbackHref={fallbackHref} />
    </div>
  );
}
