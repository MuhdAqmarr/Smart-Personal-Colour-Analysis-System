"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

export interface Swatch {
  name: string;
  hex: string;
}

interface SwatchGridProps {
  swatches: Swatch[];
  /** Show name + hex labels under each swatch (default: name in tooltip only). */
  showLabels?: boolean;
  className?: string;
}

/**
 * Accessible colour swatch grid. Each swatch is a button that copies its HEX
 * value; colour is never the only signal (name + hex text available).
 */
export function SwatchGrid({ swatches, showLabels = false, className }: SwatchGridProps) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copyHex(swatch: Swatch) {
    try {
      await navigator.clipboard.writeText(swatch.hex);
      setCopied(swatch.hex);
      toast.success(`${swatch.name} copied`, { description: swatch.hex });
      window.setTimeout(
        () => setCopied((current) => (current === swatch.hex ? null : current)),
        1500,
      );
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  return (
    <ul
      className={cn(
        "grid gap-2",
        showLabels ? "grid-cols-3 sm:grid-cols-6" : "grid-cols-6",
        className,
      )}
    >
      {swatches.map((swatch) => (
        <li key={`${swatch.name}-${swatch.hex}`} className="min-w-0">
          <button
            type="button"
            onClick={() => copyHex(swatch)}
            className="focus-visible:ring-ring/50 focus-visible:border-ring focus-visible:ring-3 group relative block w-full rounded-lg border border-black/5 outline-none"
            aria-label={`${swatch.name}, ${swatch.hex}. Copy colour code.`}
            title={`${swatch.name} — ${swatch.hex}`}
          >
            <span
              className="block aspect-square w-full rounded-[inherit]"
              style={{ backgroundColor: swatch.hex }}
            />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[inherit] bg-black/0 opacity-0 transition-opacity group-hover:bg-black/20 group-hover:opacity-100 group-focus-visible:bg-black/20 group-focus-visible:opacity-100">
              {copied === swatch.hex ? (
                <Check className="size-4 text-white drop-shadow" aria-hidden="true" />
              ) : (
                <Copy className="size-4 text-white drop-shadow" aria-hidden="true" />
              )}
            </span>
          </button>
          {showLabels ? (
            <p className="mt-1 truncate text-xs leading-tight">
              <span className="block truncate font-medium">{swatch.name}</span>
              <span className="text-muted-foreground font-mono text-[10px] uppercase">
                {swatch.hex}
              </span>
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
