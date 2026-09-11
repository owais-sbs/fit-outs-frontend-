import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import {
  JCT_TERMS_CLAUSES,
  JCT_TERMS_SUMMARY_ROWS,
  JCT_TERMS_TITLE,
} from "@/shared/content/jctTermsAndConditions";

const TERMS_FONT = { fontFamily: '"Times New Roman", Times, serif' };

export default function TermsAndConditionsPage() {
  return (
    <PageShell className="max-w-4xl mx-auto" style={TERMS_FONT}>
      <PageTitle
        title={JCT_TERMS_TITLE}
        subtitle="JCT Contracting standard commercial terms for quotations and BOQs."
      />

      <Surface className="overflow-hidden">
        <div className="border-b border-border/40 px-5 py-3">
          <h2 className="text-sm font-semibold tracking-tight">Commercial summary</h2>
        </div>
        <div className="divide-y divide-border/40">
          {JCT_TERMS_SUMMARY_ROWS.map((row) => (
            <div
              key={row.label}
              className="grid gap-2 px-5 py-4 sm:grid-cols-[minmax(140px,200px)_1fr] sm:gap-6"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {row.label}
              </p>
              {Array.isArray(row.body) ? (
                <ul className="list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-foreground">
                  {row.body.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm leading-relaxed text-foreground">{row.body}</p>
              )}
            </div>
          ))}
        </div>
      </Surface>

      <Surface className="overflow-hidden">
        <div className="border-b border-border/40 px-5 py-3">
          <h2 className="text-sm font-semibold tracking-tight">Other terms &amp; conditions</h2>
        </div>
        <ol className="space-y-4 px-5 py-5">
          {JCT_TERMS_CLAUSES.map((clause, index) => (
            <li key={index} className="flex gap-3 text-sm leading-relaxed">
              <span className="w-6 shrink-0 font-semibold tabular-nums text-muted-foreground">
                {index + 1}.
              </span>
              <span className="text-foreground">{clause}</span>
            </li>
          ))}
        </ol>
      </Surface>
    </PageShell>
  );
}
