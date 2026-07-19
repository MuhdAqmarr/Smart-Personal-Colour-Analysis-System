interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

interface LegalPageProps {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

/** Shared layout for privacy / terms / disclaimer content pages. */
export function LegalPage({ title, updated, intro, sections }: LegalPageProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="font-heading text-4xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-2 text-sm">Last updated: {updated}</p>
      <p className="mt-6 leading-relaxed">{intro}</p>
      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <section key={section.heading} aria-labelledby={section.heading}>
            <h2 id={section.heading} className="font-heading text-xl font-semibold">
              {section.heading}
            </h2>
            {section.paragraphs?.map((paragraph) => (
              <p
                key={paragraph.slice(0, 40)}
                className="text-muted-foreground mt-3 leading-relaxed"
              >
                {paragraph}
              </p>
            ))}
            {section.bullets ? (
              <ul className="text-muted-foreground mt-3 list-disc space-y-2 pl-6 leading-relaxed">
                {section.bullets.map((bullet) => (
                  <li key={bullet.slice(0, 40)}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}
