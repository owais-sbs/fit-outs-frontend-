import { JCT_COVER_LETTER, formatEstimateAmount, formatEstimateDate } from "@/modules/admin/data/jctCoverLetterCopy";
import {
  JCT_TERMS_SUMMARY_ROWS,
  JCT_TERMS_CLAUSES,
} from "@/shared/content/jctTermsAndConditions";
import jctLogo from "@/assets/jct-logo.svg";

/** Inline styles — mirrors BOQ CoverLetterTemplate for subcontract awards. */
const styles = {
  root: {
    width: 794,
    maxWidth: "100%",
    margin: "0 auto",
    background: "#ffffff",
    color: "#111827",
    fontFamily: "Segoe UI, Helvetica, Arial, sans-serif",
    boxSizing: "border-box",
    border: "1px solid #E5E1DA",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    padding: "24px 32px",
    color: "#ffffff",
    background: "linear-gradient(135deg, #1F3A34 0%, #0F2027 100%)",
  },
  headerLeft: { display: "flex", alignItems: "flex-start", gap: 12 },
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
  tagline: { margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.8)" },
  headerRight: { textAlign: "right", fontSize: 12, color: "rgba(255,255,255,0.9)", flexShrink: 0 },
  coverLabel: { margin: 0, fontWeight: 600, color: "#C8A97E" },
  quoteNo: { margin: "8px 0 0", fontFamily: "Consolas, Monaco, monospace", fontSize: 13, color: "#ffffff" },
  rev: { margin: "4px 0 0", color: "rgba(255,255,255,0.7)" },
  meta: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
    borderBottom: "1px solid #E5E1DA",
    background: "#F7F5F2",
    padding: "16px 32px",
    fontSize: 12,
  },
  metaMuted: { color: "#6B6B6B" },
  metaValue: { fontWeight: 500, color: "#111827" },
  metaRight: { textAlign: "right" },
  body: { padding: "28px 32px", fontSize: 13, lineHeight: 1.65 },
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
  paragraph: { margin: "0 0 12px", color: "#1F2937" },
  totalBox: {
    border: "1px solid rgba(31,58,52,0.2)",
    background: "#F7F5F2",
    borderRadius: 6,
    padding: "16px 20px",
    marginBottom: 20,
  },
  totalAmount: { margin: "4px 0 0", fontSize: 28, fontWeight: 700, color: "#1F3A34" },
  totalNote: { margin: "4px 0 0", fontSize: 11, color: "#6B6B6B" },
  termsTable: { width: "100%", borderCollapse: "collapse", fontSize: 12, marginTop: 8 },
  th: {
    textAlign: "left",
    padding: "8px 10px",
    borderBottom: "1px solid #E5E1DA",
    color: "#6B6B6B",
    fontWeight: 600,
    width: "32%",
  },
  thBoq: {
    textAlign: "left",
    padding: "8px 10px",
    borderBottom: "1px solid #E5E1DA",
    color: "#6B6B6B",
    fontWeight: 600,
    fontSize: 11,
    whiteSpace: "nowrap",
  },
  thBoqRight: {
    textAlign: "right",
    padding: "8px 10px",
    borderBottom: "1px solid #E5E1DA",
    color: "#6B6B6B",
    fontWeight: 600,
    fontSize: 11,
    whiteSpace: "nowrap",
  },
  td: { padding: "8px 10px", borderBottom: "1px solid #F0EEE9", color: "#1F2937", verticalAlign: "top" },
  tdBoq: { padding: "8px 10px", borderBottom: "1px solid #F0EEE9", color: "#1F2937", verticalAlign: "top", fontSize: 11 },
  tdBoqRight: {
    padding: "8px 10px",
    borderBottom: "1px solid #F0EEE9",
    color: "#1F2937",
    verticalAlign: "top",
    fontSize: 11,
    textAlign: "right",
    fontVariantNumeric: "tabular-nums",
  },
  tdBoqMuted: { padding: "8px 10px", borderBottom: "1px solid #F0EEE9", color: "#9CA3AF", fontSize: 11, fontStyle: "italic" },
  boqTotalRow: { background: "#F7F5F2", fontWeight: 600 },
  clauseList: { margin: "8px 0 0", paddingLeft: 18, fontSize: 12, color: "#374151", lineHeight: 1.55 },
  signGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 8 },
  signBox: {
    border: "1px solid #E5E1DA",
    background: "#F7F5F2",
    borderRadius: 6,
    padding: 14,
    minHeight: 140,
  },
  signTitle: { margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#1F3A34" },
  signImg: { maxHeight: 48, maxWidth: "100%", marginTop: 10, display: "contain" },
  thanks: { margin: "20px 0 0", fontSize: 12, color: "#1F3A34", fontWeight: 600 },
};

const AWARD_BODY = [
  "We are pleased to confirm the award of the above subcontract package for your execution under the Main Contract works.",
  "This Subcontract Agreement incorporates the tender documents, agreed priced BOQ, package programme, free-issue / attendance schedules, and the JCT Terms and Conditions below.",
  "The awarded prices are exclusive of Value Added Tax. Please refer to the agreed BOQ for the priced breakdown.",
  "The Subcontractor shall execute the works in strict compliance with the project specifications, drawings, and HSE / site rules.",
  "Digital signatures on the execution section constitute a legally binding electronic execution of this agreement.",
];

function money(value) {
  if (value == null || value === "") return "—";
  return formatEstimateAmount(Number(value), "AED");
}

function refCode(packageUuid) {
  if (!packageUuid) return "SC-DRAFT";
  return `SC-${String(packageUuid).slice(0, 8).toUpperCase()}`;
}

function formatQty(value) {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function formatRate(value) {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function isIncludedBoqLine(line) {
  const status = String(line?.lineStatus || "QUOTED").toUpperCase();
  return status === "QUOTED" || status === "CLARIFICATION" || status === "ALTERNATIVE";
}

function boqLinesTotal(lines) {
  return (lines || []).reduce((sum, line) => {
    if (!isIncludedBoqLine(line)) return sum;
    const amount = Number(line.amount);
    return sum + (Number.isNaN(amount) ? 0 : amount);
  }, 0);
}

/**
 * Official JCT-style subcontract award letter (same look as BOQ cover letter).
 * @param {{ contract: object, adminSignatureUrl?: string|null, subSignatureUrl?: string|null }} props
 */
export default function SubcontractAgreementLetter({
  contract,
  adminSignatureUrl = null,
  subSignatureUrl = null,
}) {
  if (!contract) return null;

  const packageName = contract.packageName || "Subcontract Package";
  const orgName = contract.organizationName || "Subcontractor";
  const projectName = contract.projectName || "—";
  const location = contract.projectLocation || JCT_COVER_LETTER.defaultCityCountry;
  const trade =
    contract.tradePackageCode && contract.tradePackageName
      ? `${contract.tradePackageCode} — ${contract.tradePackageName}`
      : contract.tradePackageName || contract.tradePackageCode || null;
  const executed = Boolean(contract.signed || contract.signedAt);
  const statusLabel = executed
    ? "EXECUTED"
    : contract.adminSigned
      ? "PENDING SUBCONTRACTOR"
      : "PENDING ADMIN";

  const awardedBoqLines = Array.isArray(contract.awardedBoqLines) ? contract.awardedBoqLines : [];
  const includedBoqLines = awardedBoqLines.filter(isIncludedBoqLine);
  const excludedBoqLines = awardedBoqLines.filter((line) => !isIncludedBoqLine(line));
  const boqSubtotal = boqLinesTotal(awardedBoqLines);

  const commercialRows = [
    ["Payment terms", contract.paymentTerms || "Per JCT standard payment schedule"],
    [
      "Retention / DLP",
      contract.retentionPct != null
        ? `${Number(contract.retentionPct)}% retention · DLP 12 months`
        : "DLP 12 months (JCT standard)",
    ],
    ["LD / delay recovery", contract.ldTerms || "Per JCT delay / non-payment recovery clauses"],
    [
      "Programme",
      [contract.plannedStart && `Start ${contract.plannedStart}`, contract.plannedFinish && `Finish ${contract.plannedFinish}`]
        .filter(Boolean)
        .join(" · ") || "Refer to package programme / master schedule",
    ],
    ["Scope inclusions", contract.tenderDescription || trade || "As tendered trade package scope"],
    ["Scope exclusions", contract.exclusionsText || "As recorded on awarded quote (if any)"],
  ];

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <img src={jctLogo} alt="JCT Contracting" style={styles.logo} crossOrigin="anonymous" />
          <div>
            <p style={styles.eyebrow}>Subcontract Award</p>
            <h1 style={styles.company}>{JCT_COVER_LETTER.companyName}</h1>
            <p style={styles.tagline}>Premium Fit-Out & Interior Solutions</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <p style={styles.coverLabel}>Cover Letter</p>
          <p style={styles.quoteNo}>{refCode(contract.packageUuid)}</p>
          <p style={styles.rev}>{statusLabel}</p>
        </div>
      </div>

      <div style={styles.meta}>
        <div>
          <p style={{ margin: "0 0 4px" }}>
            <span style={styles.metaMuted}>Date:</span>{" "}
            <span style={styles.metaValue}>{formatEstimateDate(contract.awardedAt || new Date().toISOString())}</span>
          </p>
          <p style={{ margin: 0 }}>
            <span style={styles.metaMuted}>Awarded value (excl. VAT):</span>{" "}
            <span style={styles.metaValue}>{money(contract.awardedValue)}</span>
          </p>
        </div>
        <div style={styles.metaRight}>
          <p style={{ margin: "0 0 4px" }}>
            <span style={styles.metaMuted}>Subcontractor:</span>{" "}
            <span style={styles.metaValue}>{orgName}</span>
          </p>
          <p style={{ margin: "0 0 4px" }}>
            <span style={styles.metaMuted}>Project:</span>{" "}
            <span style={styles.metaValue}>{projectName}</span>
          </p>
          <p style={{ margin: 0 }}>
            <span style={styles.metaMuted}>Location:</span>{" "}
            <span style={styles.metaValue}>{location}</span>
          </p>
        </div>
      </div>

      <div style={styles.body}>
        <div style={styles.block}>
          <p style={styles.sectionLabel}>To</p>
          <p style={{ margin: "4px 0 0", fontWeight: 500 }}>{orgName}</p>
          {trade ? <p style={{ margin: "4px 0 0", color: "#374151" }}>{trade}</p> : null}
        </div>

        <div style={styles.block}>
          <p style={styles.sectionLabel}>Subject</p>
          <p style={styles.subject}>SUBCONTRACT AWARD — {String(packageName).toUpperCase()}</p>
        </div>

        <div style={styles.block}>
          {AWARD_BODY.map((p) => (
            <p key={p} style={styles.paragraph}>
              {p}
            </p>
          ))}
        </div>

        <div style={styles.totalBox}>
          <p style={styles.sectionLabel}>Awarded subcontract value</p>
          <p style={styles.totalAmount}>{money(contract.awardedValue)}</p>
          <p style={styles.totalNote}>Exclusive of Value Added Tax · from agreed BOQ / award</p>
        </div>

        {awardedBoqLines.length > 0 ? (
          <div style={styles.block}>
            <p style={styles.sectionLabel}>Agreed priced BOQ — awarded lines</p>
            <p style={{ ...styles.totalNote, margin: "4px 0 10px" }}>
              Frozen snapshot from the winning quote. Included lines below form the priced subcontract scope.
            </p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ ...styles.termsTable, minWidth: 640 }}>
                <thead>
                  <tr>
                    <th style={styles.thBoq}>Code</th>
                    <th style={styles.thBoq}>Description</th>
                    <th style={styles.thBoq}>Unit</th>
                    <th style={styles.thBoqRight}>Qty</th>
                    <th style={styles.thBoqRight}>Rate (AED)</th>
                    <th style={styles.thBoqRight}>Amount (AED)</th>
                    <th style={styles.thBoq}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {includedBoqLines.map((line) => (
                    <tr key={line.uuid || line.boqLineId}>
                      <td style={{ ...styles.tdBoq, fontFamily: "Consolas, Monaco, monospace" }}>
                        {line.sectionCode || "—"}
                      </td>
                      <td style={styles.tdBoq}>{line.description || "—"}</td>
                      <td style={styles.tdBoq}>{line.unit || "—"}</td>
                      <td style={styles.tdBoqRight}>{formatQty(line.quantity)}</td>
                      <td style={styles.tdBoqRight}>{formatRate(line.rate)}</td>
                      <td style={styles.tdBoqRight}>{money(line.amount)}</td>
                      <td style={styles.tdBoq}>{line.lineStatus || "QUOTED"}</td>
                    </tr>
                  ))}
                  {includedBoqLines.length > 0 ? (
                    <tr style={styles.boqTotalRow}>
                      <td colSpan={5} style={{ ...styles.tdBoq, textAlign: "right", fontWeight: 600 }}>
                        Priced BOQ subtotal (included lines)
                      </td>
                      <td style={{ ...styles.tdBoqRight, fontWeight: 700, color: "#1F3A34" }}>
                        {money(boqSubtotal)}
                      </td>
                      <td style={styles.tdBoq} />
                    </tr>
                  ) : null}
                  {excludedBoqLines.map((line) => (
                    <tr key={`ex-${line.uuid || line.boqLineId}`}>
                      <td style={{ ...styles.tdBoqMuted, fontFamily: "Consolas, Monaco, monospace" }}>
                        {line.sectionCode || "—"}
                      </td>
                      <td style={styles.tdBoqMuted}>{line.description || "—"}</td>
                      <td colSpan={4} style={styles.tdBoqMuted}>
                        {line.remarks ? line.remarks : "Not included in awarded scope"}
                      </td>
                      <td style={styles.tdBoqMuted}>{line.lineStatus || "EXCLUDED"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {contract.awardedValue != null && Math.abs(Number(contract.awardedValue) - boqSubtotal) > 0.01 ? (
              <p style={{ ...styles.totalNote, marginTop: 8 }}>
                Award value AED {Number(contract.awardedValue).toLocaleString()} may differ from line subtotal due to
                rounding, negotiated adjustments, or award-value reason recorded at award.
              </p>
            ) : null}
          </div>
        ) : null}

        <div style={styles.block}>
          <p style={styles.sectionLabel}>Package commercial terms</p>
          <table style={styles.termsTable}>
            <tbody>
              {commercialRows.map(([label, value]) => (
                <tr key={label}>
                  <th style={styles.th}>{label}</th>
                  <td style={styles.td}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={styles.block}>
          <p style={styles.sectionLabel}>JCT Terms &amp; Conditions — Summary</p>
          <table style={styles.termsTable}>
            <tbody>
              {JCT_TERMS_SUMMARY_ROWS.map((row) => (
                <tr key={row.label}>
                  <th style={styles.th}>{row.label}</th>
                  <td style={styles.td}>
                    {Array.isArray(row.body)
                      ? row.body.map((line) => (
                          <div key={line}>{line}</div>
                        ))
                      : row.body}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ol style={styles.clauseList}>
            {JCT_TERMS_CLAUSES.slice(0, 8).map((clause) => (
              <li key={clause}>{clause}</li>
            ))}
          </ol>
          <p style={{ ...styles.totalNote, marginTop: 8 }}>
            Full JCT Terms and Conditions form part of this agreement.
          </p>
        </div>

        <div style={styles.block}>
          <p style={styles.sectionLabel}>Execution</p>
          <div style={styles.signGrid}>
            <div style={styles.signBox}>
              <p style={styles.signTitle}>MAIN CONTRACTOR — JCT</p>
              {contract.adminSigned ? (
                <>
                  <p style={{ margin: "8px 0 0", fontSize: 12 }}>
                    {contract.adminSignerName || "Admin"}
                    {contract.adminSignerTitle ? ` · ${contract.adminSignerTitle}` : ""}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: "#6B6B6B" }}>
                    Signed {contract.adminSignedAt ? new Date(contract.adminSignedAt).toLocaleString() : "—"}
                  </p>
                  {adminSignatureUrl ? (
                    <img src={adminSignatureUrl} alt="Admin signature" style={styles.signImg} crossOrigin="anonymous" />
                  ) : null}
                </>
              ) : (
                <p style={{ margin: "16px 0 0", fontSize: 12, color: "#6B6B6B" }}>Waiting for admin signature</p>
              )}
            </div>
            <div style={styles.signBox}>
              <p style={styles.signTitle}>SUBCONTRACTOR</p>
              {executed ? (
                <>
                  <p style={{ margin: "8px 0 0", fontSize: 12 }}>
                    {contract.subcontractorSignerName || orgName}
                    {contract.subcontractorSignerTitle ? ` · ${contract.subcontractorSignerTitle}` : ""}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: "#6B6B6B" }}>
                    Signed {contract.signedAt ? new Date(contract.signedAt).toLocaleString() : "—"}
                  </p>
                  {subSignatureUrl ? (
                    <img src={subSignatureUrl} alt="Subcontractor signature" style={styles.signImg} crossOrigin="anonymous" />
                  ) : null}
                </>
              ) : (
                <p style={{ margin: "16px 0 0", fontSize: 12, color: "#6B6B6B" }}>
                  [ Waiting for Subcontractor signature ]
                </p>
              )}
            </div>
          </div>
        </div>

        <p style={{ margin: "8px 0 0" }}>{JCT_COVER_LETTER.closing}</p>
        <p style={{ margin: "12px 0 0", fontWeight: 600 }}>{JCT_COVER_LETTER.companyName}</p>
        <p style={{ margin: "4px 0 0" }}>{JCT_COVER_LETTER.signatoryName}</p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6B6B6B" }}>{JCT_COVER_LETTER.signatoryTitle}</p>
        <p style={styles.thanks}>{JCT_COVER_LETTER.footerThanks}</p>
      </div>
    </div>
  );
}
