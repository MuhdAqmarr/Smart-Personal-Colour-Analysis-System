"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * "Back" that returns to wherever the user came from (browser history).
 * If the page was opened directly (no in-app history), it falls back to a
 * sensible destination instead of leaving the site.
 */
export function BackButton({
  fallbackHref = "/",
  label = "Back",
  className,
}: {
  fallbackHref?: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("text-muted-foreground -ml-2", className)}
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push(fallbackHref);
        }
      }}
    >
      <ArrowLeft aria-hidden="true" data-icon="inline-start" />
      {label}
    </Button>
  );
}
