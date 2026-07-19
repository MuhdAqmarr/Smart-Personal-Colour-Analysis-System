import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Marketing section opener: optional eyebrow, title, and short lede.
 * Left-aligned by default; `centred` for symmetric sections.
 */
function SectionHeading({
  id,
  eyebrow,
  title,
  lede,
  centred = false,
  className,
}: {
  id?: string;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  lede?: React.ReactNode;
  centred?: boolean;
  className?: string;
}) {
  return (
    <div
      data-slot="section-heading"
      className={cn("max-w-2xl space-y-3", centred && "mx-auto text-center", className)}
    >
      {eyebrow ? <p className="text-eyebrow text-muted-foreground">{eyebrow}</p> : null}
      <h2 id={id} className="text-title-1 text-balance">
        {title}
      </h2>
      {lede ? <p className="text-muted-foreground text-base leading-relaxed">{lede}</p> : null}
    </div>
  );
}

export { SectionHeading };
