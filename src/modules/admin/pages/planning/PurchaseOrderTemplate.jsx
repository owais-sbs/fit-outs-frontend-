import { COMPANY, BOQ_THEME, BOQ_PRINT_COLOR, formatBoqAmount, formatBoqDate } from "../boq/boqTheme";

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
 * Contracting-style purchase order template for material plan lines.
 * elementId must be unique when multiple instances are mounted.
 */
export default function PurchaseOrderTemplate({
  elementId = "material-po-print",
  projectId,
  projectName,
  packageName,
  poNumber,
  poDate,
  supplierName,
  lines = [],
}) {
  const title = packageName ? `Purchase Order — ${packageName}` : "Purchase Order";
  const grandTotal = lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
  const dateLabel = formatBoqDate(poDate);

  return (
    <div
      id={elementId}
      data-title={poNumber || title}
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
          <p style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: BOQ_THEME.navy }}>PURCHASE ORDER</p>
          <p style={{ margin: "8px 0 0", fontSize: "11px", fontWeight: 600 }}>{poNumber}</p>
          <p style={{ margin: "4px 0 0", fontSize: "10px", color: BOQ_THEME.metaLabel }}>{dateLabel}</p>
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
        <MetaCell label="Project" value={projectName || `Project #${projectId}`} />
        <MetaCell label="Package" value={packageName || "Whole material plan"} />
        <MetaCell label="Supplier" value={supplierName || "To be confirmed"} />
      </div>

      <div style={{ padding: "16px 28px 8px" }}>
        <p style={{ margin: 0, fontSize: "11px", fontWeight: 600, color: BOQ_THEME.navy }}>
          Material requisition / order schedule
        </p>
      </div>

      <div style={{ padding: "0 28px 20px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...TH_STYLE, width: "36px" }}>#</th>
              <th style={TH_STYLE}>Material</th>
              <th style={{ ...TH_STYLE, width: "72px" }}>Code</th>
              <th style={{ ...TH_STYLE, width: "56px", textAlign: "right" }}>Qty</th>
              <th style={{ ...TH_STYLE, width: "48px" }}>Unit</th>
              <th style={{ ...TH_STYLE, width: "72px", textAlign: "right" }}>Unit cost</th>
              <th style={{ ...TH_STYLE, width: "80px", textAlign: "right" }}>Amount</th>
              <th style={TH_STYLE}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ ...TD_STYLE, textAlign: "center", color: BOQ_THEME.metaLabel }}>
                  No materials in this purchase order.
                </td>
              </tr>
            ) : (
              lines.map((line, idx) => (
                <tr key={line.key || idx} style={{ backgroundColor: idx % 2 === 1 ? BOQ_THEME.lineAlt : "#fff" }}>
                  <td style={TD_STYLE}>{idx + 1}</td>
                  <td style={TD_STYLE}>
                    <div style={{ fontWeight: 600 }}>{line.materialName}</div>
                    {line.workItemLabel ? (
                      <div style={{ fontSize: "9px", color: BOQ_THEME.metaLabel, marginTop: 2 }}>{line.workItemLabel}</div>
                    ) : null}
                  </td>
                  <td style={{ ...TD_STYLE, fontFamily: "ui-monospace, monospace", fontSize: "9px" }}>
                    {line.materialCode || "—"}
                  </td>
                  <td style={{ ...TD_STYLE, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {formatQty(line.qty)}
                  </td>
                  <td style={TD_STYLE}>{line.unit || "—"}</td>
                  <td style={{ ...TD_STYLE, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {formatBoqAmount(line.unitCost || 0)}
                  </td>
                  <td style={{ ...TD_STYLE, textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                    {formatBoqAmount(line.amount || 0)}
                  </td>
                  <td style={{ ...TD_STYLE, color: BOQ_THEME.metaLabel }}>{line.notes || ""}</td>
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
        <span style={{ fontSize: "11px", fontWeight: 600 }}>Grand Total</span>
        <span style={{ fontSize: "14px", fontWeight: 700 }}>{formatBoqAmount(grandTotal)}</span>
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
          Unit costs are taken from the material master cost price and are subject to supplier confirmation.
          Delivery location is the project site unless otherwise agreed. This document is generated from the
          project material plan{packageName ? ` package “${packageName}”` : ""}.
        </p>
        <p style={{ margin: "8px 0 0" }}>{COMPANY.name} · {title}</p>
      </div>
    </div>
  );
}

function MetaCell({ label, value }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.04em", color: BOQ_THEME.metaLabel }}>
        {label}
      </p>
      <p style={{ margin: "4px 0 0", fontSize: "12px", fontWeight: 600, color: BOQ_THEME.navyDark }}>{value}</p>
    </div>
  );
}

function formatQty(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}
