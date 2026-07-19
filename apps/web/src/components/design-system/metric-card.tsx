import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Compact numeric tile for dashboards. Solid surface by design — metrics
 * are dense data, not decoration.
 */
function MetricCard({
  label,
  value,
  hint,
  icon,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div
      data-slot="metric-card"
      className={cn("bg-card ring-border shadow-xs rounded-xl p-4 ring-1", className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-[0.8125rem] font-medium">{label}</p>
        {icon ? (
          <span className="text-muted-foreground [&_svg]:size-4" aria-hidden="true">
            {icon}
          </span>
        ) : null}
      </div>
      <p className="text-foreground mt-2 text-2xl font-semibold tracking-[-0.01em] tabular-nums">
        {value}
      </p>
      {hint ? <p className="text-muted-foreground mt-1 text-xs">{hint}</p> : null}
    </div>
  );
}

export { MetricCard };
