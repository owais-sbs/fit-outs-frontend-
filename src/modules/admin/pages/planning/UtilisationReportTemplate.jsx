import { COMPANY, BOQ_THEME, BOQ_PRINT_COLOR, formatBoqDate } from "../boq/boqTheme";

const TH_STYLE = {
  ...BOQ_PRINT_COLOR,
  backgroundColor: BOQ_THEME.tableHeader,
  color: "#ffffff",
  fontSize: "10px",
  fontWeight: 600,
  textAlign: "left",
  padding: "8px 6px",
};

const TD_STYLE = {
  ...BOQ_PRINT_COLOR,
  fontSize: "10px",
  padding: "7px 6px",
  borderBottom: `1px solid ${BOQ_THEME.metaBorder}`,
  verticalAlign: "top",
};

/**
 * Utilisation report print template (labour or plant/tool).
 * Styled like PurchaseOrderTemplate / BOQ_THEME. elementId must be unique.
 */
export default function UtilisationReportTemplate({
  elementId = "utilisation-report-print",
  variant = "labour",
  projectId,
  projectName,
  reportDate,
  rows = [],
  totalDays = 0,
  assignmentCount = 0,
}) {
  const isLabour = variant === "labour";
  const docTitle = isLabour ? "LABOUR UTILISATION" : "RESOURCE UTILISATION";
  const sectionLabel = isLabour ? "Crew assignments" : "Plant & tool assignments";
  const daysLabel = isLabour ? "Crew-days" : "Resource-days";
  const dateLabel = formatBoqDate(reportDate);
  const displayProject = projectName || `Project #${projectId}`;
  const colSpan = isLabour ? 7 : 8;

  return (
    <div
      id={elementId}
      data-title={`${docTitle} — ${displayProject}`}
      className="boq-document overflow-hidden bg-white"
      style={{
        ...BOQ_PRINT_COLOR,
        border: `1px solid ${BOQ_THEME.metaBorder}`,
        fontFamily: "Inter, system-ui, sans-serif",
        color: BOQ_THEME.navyDark,
        width: "794px",
        maxWidth: "794px",
      }}
    >
      <div
        style={{
          ...BOQ_PRINT_COLOR,
          display: "flex",
          justifyContent: "space-between",
          gap: "24px",
          padding: "28px 28px 20px",
          borderBottom: `3px solid ${BOQ_THEME.navy}`,
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: BOQ_THEME.navy }}>{COMPANY.name}</p>
          <p style={{ margin: "4px 0 0", fontSize: "11px", color: BOQ_THEME.metaLabel }}>{COMPANY.tagline}</p>
          <p style={{ margin: "10px 0 0", fontSize: "10px", lineHeight: 1.5, color: BOQ_THEME.metaLabel }}>
            {COMPANY.address}
            <br />
            {COMPANY.email} · {COMPANY.phone}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: BOQ_THEME.navy }}>{docTitle}</p>
          <p style={{ margin: "8px 0 0", fontSize: "10px", color: BOQ_THEME.metaLabel }}>{dateLabel}</p>
        </div>
      </div>

      <div
        style={{
          ...BOQ_PRINT_COLOR,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "12px",
          padding: "16px 28px",
          backgroundColor: BOQ_THEME.cream,
          borderBottom: `1px solid ${BOQ_THEME.metaBorder}`,
        }}
      >
        <MetaCell label="Project" value={displayProject} />
        <MetaCell label="Report" value={isLabour ? "Labour plan" : "Resource plan"} />
        <MetaCell label="Generated" value={dateLabel} />
      </div>

      <div
        style={{
          ...BOQ_PRINT_COLOR,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          padding: "12px 28px",
          borderBottom: `1px solid ${BOQ_THEME.metaBorder}`,
        }}
      >
        <MetaCell label="Assignments" value={String(assignmentCount ?? rows.length)} />
        <MetaCell label={daysLabel} value={String(totalDays ?? 0)} />
      </div>

      <div style={{ padding: "16px 28px 8px" }}>
        <p style={{ margin: 0, fontSize: "11px", fontWeight: 600, color: BOQ_THEME.navy }}>{sectionLabel}</p>
      </div>

      <div style={{ padding: "0 28px 20px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...TH_STYLE, width: "36px" }}>#</th>
              {isLabour ? (
                <>
                  <th style={TH_STYLE}>Crew</th>
                  <th style={{ ...TH_STYLE, width: "64px", textAlign: "right" }}>Headcount</th>
                </>
              ) : (
                <>
                  <th style={TH_STYLE}>Resource</th>
                  <th style={{ ...TH_STYLE, width: "56px" }}>Kind</th>
                  <th style={{ ...TH_STYLE, width: "48px", textAlign: "right" }}>Qty</th>
                </>
              )}
              <th style={TH_STYLE}>Activity</th>
              <th style={{ ...TH_STYLE, width: "88px" }}>Start</th>
              <th style={{ ...TH_STYLE, width: "88px" }}>End</th>
              <th style={{ ...TH_STYLE, width: "48px", textAlign: "right" }}>Days</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} style={{ ...TD_STYLE, textAlign: "center", color: BOQ_THEME.metaLabel }}>
                  No assignments for this project.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={row.key || idx} style={{ backgroundColor: idx % 2 === 1 ? BOQ_THEME.lineAlt : "#fff" }}>
                  <td style={TD_STYLE}>{idx + 1}</td>
                  {isLabour ? (
                    <>
                      <td style={{ ...TD_STYLE, fontWeight: 600 }}>{row.crewName || "—"}</td>
                      <td style={{ ...TD_STYLE, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {row.headcount ?? 0}
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ ...TD_STYLE, fontWeight: 600 }}>{row.resourceName || "—"}</td>
                      <td style={TD_STYLE}>{row.kind || "—"}</td>
                      <td style={{ ...TD_STYLE, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {row.quantity ?? 1}
                      </td>
                    </>
                  )}
                  <td style={TD_STYLE}>{row.activityName || "—"}</td>
                  <td style={{ ...TD_STYLE, fontVariantNumeric: "tabular-nums" }}>{row.startDate || "—"}</td>
                  <td style={{ ...TD_STYLE, fontVariantNumeric: "tabular-nums" }}>{row.endDate || "—"}</td>
                  <td style={{ ...TD_STYLE, textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                    {row.days ?? 0}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div
        style={{
          ...BOQ_PRINT_COLOR,
          margin: "0 28px 24px",
          padding: "12px 16px",
          backgroundColor: BOQ_THEME.grandTotalBg,
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderRadius: "4px",
        }}
      >
        <span style={{ fontSize: "11px", fontWeight: 600 }}>Total {daysLabel}</span>
        <span style={{ fontSize: "14px", fontWeight: 700 }}>{totalDays ?? 0}</span>
      </div>

      <div
        style={{
          padding: "12px 28px 24px",
          borderTop: `1px solid ${BOQ_THEME.metaBorder}`,
          fontSize: "9px",
          color: BOQ_THEME.metaLabel,
          lineHeight: 1.5,
        }}
      >
        <p style={{ margin: 0 }}>
          Assignment days are inclusive calendar days between start and end dates. This document is generated
          from the project {isLabour ? "labour" : "resource"} plan.
        </p>
        <p style={{ margin: "8px 0 0" }}>
          {COMPANY.name} · {docTitle} · {displayProject}
        </p>
      </div>
    </div>
  );
}

function MetaCell({ label, value }) {
  return (
    <div>
      <p
        style={{
          margin: 0,
          fontSize: "9px",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: BOQ_THEME.metaLabel,
        }}
      >
        {label}
      </p>
      <p style={{ margin: "4px 0 0", fontSize: "12px", fontWeight: 600, color: BOQ_THEME.navyDark }}>{value}</p>
    </div>
  );
}
