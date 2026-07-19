import * as React from "react";

import { cn } from "@/lib/utils";

const sizeClass = {
  default: "max-w-6xl",
  narrow: "max-w-3xl",
  wide: "max-w-7xl",
} as const;

/** Standard horizontal page rhythm: centred column with responsive gutters. */
function PageContainer({
  size = "default",
  className,
  ...props
}: React.ComponentProps<"div"> & { size?: keyof typeof sizeClass }) {
  return (
    <div
      data-slot="page-container"
      className={cn("mx-auto w-full px-4 sm:px-6", sizeClass[size], className)}
      {...props}
    />
  );
}

export { PageContainer };
