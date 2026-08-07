/**
 * Shared presentational blocks for the unlisted documentation pages
 * (/docs and /docs/technical). Server-safe: no client hooks.
 */

export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-8">
      <h2 id={`${id}-h`} className="text-xl font-bold tracking-[-0.01em] sm:text-2xl">
        {title}
      </h2>
      <div className="text-foreground/90 mt-4 space-y-4 text-[0.95rem] leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div data-print-card className="border-border bg-card rounded-2xl border p-4 sm:p-5">
      {title ? <h3 className="mb-2 text-sm font-semibold">{title}</h3> : null}
      <div className="text-muted-foreground space-y-2 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export function Step({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li data-print-card className="border-border bg-card flex gap-3.5 rounded-2xl border p-4">
      <span className="bg-primary text-primary-foreground mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold tabular-nums">
        {n}
      </span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{children}</p>
      </div>
    </li>
  );
}

export function QA({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div data-print-card className="border-border bg-card rounded-2xl border p-4 sm:p-5">
      <p className="text-sm font-semibold">“{q}”</p>
      <div className="text-muted-foreground mt-2 space-y-2 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

/** Monospace block for code, trees, and formulas. */
export function Mono({ children }: { children: React.ReactNode }) {
  return (
    <pre className="border-border bg-card overflow-x-auto rounded-2xl border p-4 font-mono text-xs leading-relaxed">
      {children}
    </pre>
  );
}

/** Simple three-column reference table. */
export function RefTable({
  head,
  rows,
  minWidth = "30rem",
}: {
  head: readonly [string, string, string];
  rows: ReadonlyArray<readonly [string, string, string]>;
  minWidth?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm" style={{ minWidth }}>
        <thead>
          <tr className="border-border border-b text-left">
            {head.map((h) => (
              <th key={h} className="py-2 pr-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-muted-foreground">
          {rows.map(([a, b, c]) => (
            <tr key={`${a}-${b}`} className="border-border/60 border-b align-top">
              <td className="text-foreground whitespace-nowrap py-2 pr-3 font-medium">{a}</td>
              <td className="py-2 pr-3 font-mono text-xs">{b}</td>
              <td className="py-2">{c}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
