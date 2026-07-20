import * as React from "react";

import { cn } from "@/lib/utils";

type StatusTone = "neutral" | "success" | "warning" | "error" | "info";

const dotClass: Record<StatusTone, string> = {
  neutral: "bg-muted-foreground",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-destructive",
  info: "bg-info",
};

const textClass: Record<StatusTone, string> = {
  neutral: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
  error: "text-destructive",
  info: "text-info",
};

/** Dot + label status. Meaning is always carried by the text, never colour alone. */
function StatusIndicator({
  tone = "neutral",
  children,
  className,
  ...props
}: React.ComponentProps<"span"> & { tone?: StatusTone }) {
  return (
    <span
      data-slot="status-indicator"
      className={cn(
        "inline-flex items-center gap-1.5 text-[0.8125rem] font-medium",
        textClass[tone],
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", dotClass[tone])} />
      {children}
    </span>
  );
}

export { StatusIndicator, type StatusTone };
