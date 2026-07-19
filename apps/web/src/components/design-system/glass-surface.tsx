import * as React from "react";

import { cn } from "@/lib/utils";

type GlassVariant = "subtle" | "default" | "elevated" | "navigation" | "modal" | "result";

const variantClass: Record<GlassVariant, string> = {
  subtle: "glass-subtle",
  default: "glass-default",
  elevated: "glass-elevated",
  navigation: "glass-navigation",
  modal: "glass-modal",
  result: "glass-result",
};

/**
 * A glass material surface. Use sparingly — navigation, floating panels,
 * modals, and the result summary. Dense content belongs on solid surfaces.
 * Never nest one glass surface inside another.
 */
function GlassSurface({
  variant = "default",
  className,
  ...props
}: React.ComponentProps<"div"> & { variant?: GlassVariant }) {
  return (
    <div
      data-slot="glass-surface"
      data-variant={variant}
      className={cn(variantClass[variant], "rounded-2xl", className)}
      {...props}
    />
  );
}

export { GlassSurface, type GlassVariant };
