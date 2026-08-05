"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ResultSectionProps {
  title: string;
  description?: string;
  /** Optional trailing content in the header row (e.g. a count badge). */
  meta?: ReactNode;
  /** Start expanded. Use for the one or two sections worth showing up front. */
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * A collapsible result block. The analysis result is long, so each section is
 * tucked behind its own header to keep the page compact. Sections are
 * independent disclosures (not a one-at-a-time accordion) — opening "Products"
 * never collapses your palette — and each keeps its own open/closed state.
 */
export function ResultSection({
  title,
  description,
  meta,
  defaultOpen = false,
  children,
  className,
}: ResultSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <Card className={cn("gap-0 py-0", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="focus-visible:ring-ring/50 hover:bg-surface/60 px-(--card-spacing) py-(--card-spacing) duration-(--motion-fast) flex w-full items-start justify-between gap-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset"
      >
        <span className="min-w-0">
          <span className="block text-base font-semibold tracking-[-0.01em]">{title}</span>
          {description ? (
            <span className="text-muted-foreground mt-1 block text-sm leading-relaxed">
              {description}
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 flex shrink-0 items-center gap-2">
          {meta}
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "text-muted-foreground duration-(--motion-fast) size-5 transition-transform",
              open && "rotate-180",
            )}
          />
        </span>
      </button>
      {open ? (
        <div id={panelId} className="px-(--card-spacing) pb-(--card-spacing)">
          {children}
        </div>
      ) : null}
    </Card>
  );
}
