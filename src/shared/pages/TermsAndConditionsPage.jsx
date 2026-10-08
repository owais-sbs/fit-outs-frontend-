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

const NAV_ITEMS = [
  {
    id: "commercial-summary",
    label: "Commercial summary",
    children: JCT_TERMS_SUMMARY_ROWS.map((row) => ({
      id: slugify(row.label),
      label: row.label,
    })),
  },
  {
    id: "other-terms",
    label: "Other terms & conditions",
  },
];

function SectionCard({ id, className, children }) {
  return (
    <article
      id={id}
      className={cn(
        "scroll-mt-28 rounded-sm border border-border bg-muted/30",
        className
      )}
    >
      {children}
    </article>
  );
}

function NavLink({ href, children, nested = false }) {
  return (
    <a
      href={href}
      className={cn(
        "block rounded-md px-3 py-1.5 text-sm leading-snug text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        nested ? "pl-3 text-[13px]" : "font-medium text-foreground/85"
      )}
    >
      {children}
    </a>
  );
}

export default function TermsAndConditionsPage() {
  return (
    <PageShell className="max-w-none">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="max-w-4xl border-b border-border pb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {JCT_TERMS_TITLE}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {SUBTITLE}
          </p>
        </header>

        <div className="mt-10 flex flex-col gap-10 lg:flex-row lg:gap-16">
          <div className="min-w-0 max-w-4xl flex-1 space-y-12">
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
                                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-sm bg-muted-foreground/50"
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
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-border bg-card text-xs font-bold tabular-nums text-muted-foreground"
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

          <aside className="hidden shrink-0 lg:block lg:w-56 xl:w-60">
            <nav
              aria-label="Terms and conditions sections"
              className="sticky top-24 rounded-lg border border-border/70 bg-card p-3 shadow-sm"
            >
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                On this page
              </p>
              <ul className="space-y-0.5">
                {NAV_ITEMS.map((item) => (
                  <li key={item.id}>
                    <NavLink href={`#${item.id}`}>{item.label}</NavLink>
                    {item.children ? (
                      <ul className="ml-3 mt-0.5 space-y-0.5 border-l border-border/60 pl-2">
                        {item.children.map((child) => (
                          <li key={child.id}>
                            <NavLink href={`#${child.id}`} nested>
                              {child.label}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
