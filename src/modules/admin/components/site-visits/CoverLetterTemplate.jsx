import { forwardRef, useMemo } from "react";
import {
  JCT_COVER_LETTER,
  formatEstimateAmount,
  formatEstimateDate,
} from "../../data/jctCoverLetterCopy";
import { computeSubtotal } from "../../api/site-visit-estimate.api";
import jctLogo from "@/assets/jct-logo.svg";

/** Inline styles only — html2canvas export strips Tailwind classes. */
const styles = {
  root: {
    width: 794,
    maxWidth: "100%",
    margin: "0 auto",
    background: "#ffffff",
    color: "#111827",
    fontFamily: "Segoe UI, Helvetica, Arial, sans-serif",
    boxSizing: "border-box",
  },
  letter: {
    border: "1px solid #E5E1DA",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    padding: "24px 32px",
    color: "#ffffff",
    background: "linear-gradient(135deg, #1F3A34 0%, #0F2027 100%)",
    boxSizing: "border-box",
  },
  headerLeft: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
  },
  logo: {
    height: 44,
    width: "auto",
    borderRadius: 2,
    border: "1px solid rgba(255,255,255,0.12)",
    display: "block",
    flexShrink: 0,
  },
  eyebrow: {
    margin: 0,
    fontSize: 11,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.7)",
  },
  company: {
    margin: "4px 0 0",
    fontSize: 26,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    color: "#ffffff",
  },
  tagline: {
    margin: "4px 0 0",
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  headerRight: {
    textAlign: "right",
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    flexShrink: 0,
  },
  coverLabel: {
    margin: 0,
    fontWeight: 600,
    color: "#C8A97E",
  },
  quoteNo: {
    margin: "8px 0 0",
    fontFamily: "Consolas, Monaco, monospace",
    fontSize: 13,
    color: "#ffffff",
  },
  rev: {
    margin: "4px 0 0",
    color: "rgba(255,255,255,0.7)",
  },
  meta: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
    borderBottom: "1px solid #E5E1DA",
    background: "#F7F5F2",
    padding: "16px 32px",
    fontSize: 12,
    boxSizing: "border-box",
  },
  metaMuted: { color: "#6B6B6B" },
  metaValue: { fontWeight: 500, color: "#111827" },
  metaRight: { textAlign: "right" },
  body: {
    padding: "28px 32px",
    fontSize: 13,
    lineHeight: 1.65,
    boxSizing: "border-box",
  },
  sectionLabel: {
    margin: 0,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#6B6B6B",
  },
  block: { marginBottom: 20 },
  subject: {
    margin: "4px 0 0",
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: "0.02em",
    color: "#111827",
  },
  paragraph: {
    margin: "0 0 12px",
    color: "#1F2937",
  },
  totalBox: {
    border: "1px solid rgba(31,58,52,0.2)",
    background: "#F7F5F2",
    borderRadius: 6,
    padding: "16px 20px",
    marginBottom: 20,
  },
  totalAmount: {
    margin: "4px 0 0",
    fontSize: 28,
    fontWeight: 700,
    color: "#1F3A34",
  },
  totalNote: {
    margin: "4px 0 0",
    fontSize: 11,
    color: "#6B6B6B",
  },
  signName: {
    margin: "24px 0 0",
    fontWeight: 600,
    color: "#111827",
  },
  signTitle: {
    margin: "2px 0 0",
    color: "#6B6B6B",
  },
  thanks: {
    margin: "24px 0 0",
    textAlign: "center",
    fontSize: 12,
    fontStyle: "italic",
    color: "#6B6B6B",
  },
  appendix: {
    marginTop: 24,
    border: "1px solid #E5E1DA",
    boxSizing: "border-box",
  },
  appendixHeader: {
    background: "#1F3A34",
    padding: "16px 32px",
    color: "#ffffff",
  },
  appendixTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 600,
  },
  appendixSub: {
    margin: "4px 0 0",
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
  },
  appendixBody: {
    padding: "20px 32px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 12,
  },
  th: {
    padding: "8px 0",
    textAlign: "left",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#6B6B6B",
    borderBottom: "1px solid #E5E1DA",
  },
  thRight: {
    padding: "8px 0",
    textAlign: "right",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#6B6B6B",
    borderBottom: "1px solid #E5E1DA",
  },
  td: {
    padding: "10px 0",
    borderBottom: "1px solid #F0EDE8",
    color: "#111827",
  },
  tdRight: {
    padding: "10px 0",
    textAlign: "right",
    fontWeight: 500,
    borderBottom: "1px solid #F0EDE8",
    color: "#111827",
  },
  footLeft: {
    paddingTop: 16,
    fontSize: 14,
    fontWeight: 600,
  },
  footRight: {
    paddingTop: 16,
    textAlign: "right",
    fontSize: 14,
    fontWeight: 700,
  },
};

const CoverLetterTemplate = forwardRef(function CoverLetterTemplate(
  { estimate, includeAppendix = true },
  ref
) {
  const lines = useMemo(
    () => (Array.isArray(estimate?.lines) ? estimate.lines : []),
    [estimate?.lines]
  );
  const subtotal = Number(estimate?.subtotal ?? computeSubtotal(lines));
  const currency = estimate?.currency || "AED";

  const categoryTotals = useMemo(() => {
    const map = new Map();
    lines.forEach((line) => {
      const key = line.category || "General";
      const amount = Number(line.amount ?? Number(line.qty || 0) * Number(line.rate || 0));
      map.set(key, (map.get(key) || 0) + (Number.isFinite(amount) ? amount : 0));
    });
    return [...map.entries()].map(([category, total]) => ({ category, total }));
  }, [lines]);

  return (
    <div ref={ref} id="site-visit-cover-letter" style={styles.root}>
      <div style={styles.letter}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <img src={jctLogo} alt="JCT Contracting" style={styles.logo} crossOrigin="anonymous" />
            <div>
              <p style={styles.eyebrow}>Quotation</p>
              <h1 style={styles.company}>{JCT_COVER_LETTER.companyName}</h1>
              <p style={styles.tagline}>Premium Fit-Out & Interior Solutions</p>
            </div>
          </div>
          <div style={styles.headerRight}>
            <p style={styles.coverLabel}>Cover Letter</p>
            <p style={styles.quoteNo}>{estimate?.quoteNo || "QTN-JCT-••••"}</p>
            <p style={styles.rev}>Rev {estimate?.revision || "R0"}</p>
          </div>
        </div>

        <div style={styles.meta}>
          <div>
            <p style={{ margin: "0 0 4px" }}>
              <span style={styles.metaMuted}>Date:</span>{" "}
              <span style={styles.metaValue}>{formatEstimateDate(new Date().toISOString())}</span>
            </p>
            <p style={{ margin: 0 }}>
              <span style={styles.metaMuted}>Valid Until:</span>{" "}
              <span style={styles.metaValue}>{formatEstimateDate(estimate?.validUntil)}</span>
            </p>
          </div>
          <div style={styles.metaRight}>
            <p style={{ margin: "0 0 4px" }}>
              <span style={styles.metaMuted}>Client:</span>{" "}
              <span style={styles.metaValue}>{estimate?.clientName || "—"}</span>
            </p>
            <p style={{ margin: "0 0 4px" }}>
              <span style={styles.metaMuted}>Project:</span>{" "}
              <span style={styles.metaValue}>{estimate?.projectLabel || "—"}</span>
            </p>
            <p style={{ margin: 0 }}>
              <span style={styles.metaMuted}>Location:</span>{" "}
              <span style={styles.metaValue}>{estimate?.locationLabel || "—"}</span>
            </p>
          </div>
        </div>

        <div style={styles.body}>
          <div style={styles.block}>
            <p style={styles.sectionLabel}>To</p>
            <p style={{ margin: "4px 0 0", fontWeight: 500 }}>
              Mr./Ms. {estimate?.clientName || "______________"}
            </p>
            <p style={{ margin: "4px 0 0", color: "#374151", whiteSpace: "pre-line" }}>
              {estimate?.clientAddress || "address here"}
            </p>
            <p style={{ margin: "4px 0 0", color: "#374151" }}>
              {JCT_COVER_LETTER.defaultCityCountry}
            </p>
          </div>

          <div style={styles.block}>
            <p style={styles.sectionLabel}>Subject</p>
            <p style={styles.subject}>
              {estimate?.subject || "TURNKEY RENOVATION, DUBAI, UAE"}
            </p>
          </div>

          <div style={styles.block}>
            {JCT_COVER_LETTER.body.map((paragraph) => (
              <p key={paragraph} style={styles.paragraph}>
                {paragraph}
              </p>
            ))}
          </div>

          <div style={styles.totalBox}>
            <p style={styles.sectionLabel}>Rough estimate total</p>
            <p style={styles.totalAmount}>{formatEstimateAmount(subtotal, currency)}</p>
            <p style={styles.totalNote}>Exclusive of Value Added Tax · from draft BoQ</p>
          </div>

          <div style={styles.block}>
            <p style={{ margin: 0 }}>{JCT_COVER_LETTER.closing}</p>
            <p style={{ margin: "16px 0 0" }}>For</p>
            <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{JCT_COVER_LETTER.companyName}</p>
            <p style={styles.signName}>{JCT_COVER_LETTER.signatoryName}</p>
            <p style={styles.signTitle}>{JCT_COVER_LETTER.signatoryTitle}</p>
            {estimate?.preparedBy ? (
              <p style={{ margin: "16px 0 0", fontSize: 12, color: "#6B6B6B" }}>
                Prepared by: {estimate.preparedBy} (Quantity Surveyor)
              </p>
            ) : null}
          </div>

          <p style={styles.thanks}>{JCT_COVER_LETTER.footerThanks}</p>
        </div>
      </div>

      {includeAppendix ? (
        <div style={styles.appendix}>
          <div style={styles.appendixHeader}>
            <h2 style={styles.appendixTitle}>Draft BoQ Summary</h2>
            <p style={styles.appendixSub}>
              Indicative breakdown by category — not a finalized project BoQ.
            </p>
          </div>
          <div style={styles.appendixBody}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Category</th>
                  <th style={styles.thRight}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {categoryTotals.length === 0 ? (
                  <tr>
                    <td colSpan={2} style={{ ...styles.td, color: "#6B6B6B" }}>
                      No estimate lines.
                    </td>
                  </tr>
                ) : (
                  categoryTotals.map((row) => (
                    <tr key={row.category}>
                      <td style={styles.td}>{row.category}</td>
                      <td style={styles.tdRight}>
                        {formatEstimateAmount(row.total, currency)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td style={styles.footLeft}>Total (excl. VAT)</td>
                  <td style={styles.footRight}>
                    {formatEstimateAmount(subtotal, currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
});

export default CoverLetterTemplate;
