import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A tactile colour swatch: rounded square of the colour with an inner
 * hairline so light colours read against any surface. Meaning is always
 * duplicated in text (name/hex) for colour-vision accessibility.
 */
function ColourChip({
  hex,
  size = "default",
  className,
  ...props
}: React.ComponentProps<"span"> & {
  hex: string;
  size?: "sm" | "default" | "lg";
}) {
  return (
    <span
      data-slot="colour-chip"
      className={cn(
        "inline-block shrink-0 rounded-lg shadow-[inset_0_0_0_1px_oklch(0.2_0.01_260/10%)]",
        size === "sm" && "size-6 rounded-md",
        size === "default" && "size-9",
        size === "lg" && "size-12 rounded-xl",
        className,
      )}
      style={{ backgroundColor: hex }}
      {...props}
    />
  );
}

export { ColourChip };
