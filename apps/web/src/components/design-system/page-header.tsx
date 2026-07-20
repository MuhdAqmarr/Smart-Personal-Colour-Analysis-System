import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Application page header: title on the left, contextual actions on the
 * right. Gives every authenticated page the same calm opening rhythm.
 */
function PageHeader({
  title,
  description,
  actions,
  className,
  ...props
}: React.ComponentProps<"header"> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header
      data-slot="page-header"
      className={cn("mb-8 flex flex-wrap items-start justify-between gap-4", className)}
      {...props}
    >
      <div className="min-w-0 space-y-1.5">
        <h1 className="text-title-2 text-balance">{title}</h1>
        {description ? (
          <p className="text-muted-foreground max-w-prose text-[0.9375rem] leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export { PageHeader };
