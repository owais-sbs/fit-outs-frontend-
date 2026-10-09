import { PageShell } from "@/components/layout/PageShell";
import {
  JCT_TERMS_CLAUSES,
  JCT_TERMS_SUMMARY_ROWS,
  JCT_TERMS_TITLE,
} from "@/shared/content/jctTermsAndConditions";
import { cn } from "@/lib/utils";

const SUBTITLE =
  "JCT Contracting standard commercial terms for quotations and BOQs.";

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function SectionCard({ id, className, children }) {
  return (
    <article
      id={id}
      className={cn(
        "scroll-mt-28 rounded-lg border border-border/70 bg-card shadow-sm",
        className
      )}
    >
      {children}
    </article>
  );
}

export default function TermsAndConditionsPage() {
  return (
    <PageShell className="max-w-none">
      <header className="max-w-4xl border-b border-border pb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {JCT_TERMS_TITLE}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {SUBTITLE}
        </p>
      </header>

      <div className="mt-8 max-w-4xl space-y-12">
        <section
          id="commercial-summary"
          className="scroll-mt-28 space-y-6"
          aria-labelledby="commercial-summary-heading"
        >
          <h2
            id="commercial-summary-heading"
            className="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
          >
            Commercial summary
          </h2>

          <div className="space-y-3">
            {JCT_TERMS_SUMMARY_ROWS.map((row) => (
              <SectionCard key={row.label} id={slugify(row.label)}>
                <div className="border-b border-border/80 px-5 py-3.5 sm:px-6">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    {row.label}
                  </h3>
                </div>
                <div className="px-5 py-4 sm:px-6">
                  {Array.isArray(row.body) ? (
                    <ul className="list-none space-y-2.5 text-sm leading-relaxed text-foreground/90">
                      {row.body.map((line) => (
                        <li key={line} className="flex gap-3">
                          <span
                            aria-hidden="true"
                            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-sm bg-[#C9A96E]"
                          />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {row.body}
                    </p>
                  )}
                </div>
              </SectionCard>
            ))}
          </div>
        </section>

        <section
          id="other-terms"
          className="scroll-mt-28 space-y-6"
          aria-labelledby="other-terms-heading"
        >
          <h2
            id="other-terms-heading"
            className="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
          >
            Other terms &amp; conditions
          </h2>

          <SectionCard className="overflow-hidden">
            <ol className="divide-y divide-border/80">
              {JCT_TERMS_CLAUSES.map((clause, index) => (
                <li
                  key={index}
                  className="flex gap-4 px-5 py-4 sm:gap-5 sm:px-6 sm:py-5"
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-xs font-bold tabular-nums text-muted-foreground"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <p className="pt-0.5 text-sm leading-relaxed text-foreground/90">
                    {clause}
                  </p>
                </li>
              ))}
            </ol>
          </SectionCard>
        </section>
      </div>
    </PageShell>
  );
}
