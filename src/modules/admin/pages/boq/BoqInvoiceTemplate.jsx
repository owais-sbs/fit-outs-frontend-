import { Fragment } from "react";
import BoqDocumentHeader, { BoqMetaBar, BoqDocumentFooter } from "./BoqDocumentHeader";
import {
  BOQ_THEME,
  BOQ_PRINT_COLOR,
  buildBoqHierarchy,
  buildAdditionalHierarchy,
  formatBoqAmount,
  resolveSurface,
} from "./boqTheme";

function SurfaceBadge({ label }) {
  return (
    <span
      className="inline-block rounded px-2.5 py-1 text-[10px] font-medium"
      style={{
        ...BOQ_PRINT_COLOR,
        backgroundColor: BOQ_THEME.surfaceBadge,
        color: BOQ_THEME.surfaceBadgeText,
      }}
    >
      {label}
    </span>
  );
}

const TH_STYLE = {
  ...BOQ_PRINT_COLOR,
  backgroundColor: BOQ_THEME.tableHeader,
  color: "#ffffff",
};

export default function BoqInvoiceTemplate({ boq, floors, rooms }) {
  const project = boq.project || {};
  const projectName = project.projectName || project.name || "Project";
  const clientName = project.clientName || project.client || "N/A";
  const hierarchy = buildBoqHierarchy(floors, rooms, boq.lines);
  const additionalGroups = buildAdditionalHierarchy(boq.lines);
  const currency = boq.currency || "AED";
  const qasLineCount = (boq.lines || []).filter((l) => l.source !== "additional").length;
  const additionalLineCount = (boq.lines || []).filter((l) => l.source === "additional").length;

  const metaItems = [
    { label: "Project", value: projectName },
    { label: "Client", value: clientName },
    { label: "BOQ Reference", value: boq.ref, highlight: true },
    { label: "Status", value: (boq.status || "draft").toUpperCase(), highlight: boq.status === "final" },
    { label: "Survey Items", value: String(qasLineCount) },
    { label: "Additional Items", value: String(additionalLineCount) },
    { label: "Grand Total", value: formatBoqAmount(boq.totals.grandTotal, currency), highlight: true },
  ];

  return (
    <div
      id="boq-invoice-print"
      data-title={boq.ref}
      className="boq-document overflow-hidden bg-white"
      style={{
        ...BOQ_PRINT_COLOR,
        border: `1px solid ${BOQ_THEME.metaBorder}`,
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      }}
    >
      <BoqDocumentHeader
        variant="invoice"
        refCode={boq.ref}
        generatedAt={boq.generatedAt}
        qasRef={boq.qasRef}
      />

      <BoqMetaBar items={metaItems} />

      <div
        className="px-5 py-2.5 border-x text-[10px] font-bold uppercase tracking-[0.14em]"
        style={{
          ...BOQ_PRINT_COLOR,
          borderColor: BOQ_THEME.metaBorder,
          backgroundColor: BOQ_THEME.sectionBg,
          color: "#6b7280",
        }}
      >
        Bill of Quantities — Floor &amp; Room Breakdown
      </div>

      <div className="border-x" style={{ borderColor: BOQ_THEME.metaBorder }}>
        <table className="w-full border-collapse text-sm" style={BOQ_PRINT_COLOR}>
          <thead>
            <tr>
              {["#", "Work Item", "Surface", "Qty", "Unit", "Unit Cost", "Total"].map((col, i) => (
                <th
                  key={col}
                  className="px-4 py-3 text-[10px] font-bold uppercase tracking-wide"
                  style={{
                    ...TH_STYLE,
                    textAlign: i >= 3 ? "right" : "left",
                    width: i === 0 ? "40px" : undefined,
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hierarchy.length === 0 && additionalGroups.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-sm text-gray-500">
                  No billable items. Complete the survey or add charges below.
                </td>
              </tr>
            )}

            {hierarchy.map(({ floor, rooms: roomGroups, total: floorTotal }) => (
              <Fragment key={`floor-block-${floor.id}`}>
                <tr
                  style={{
                    ...BOQ_PRINT_COLOR,
                    background: `linear-gradient(90deg, ${BOQ_THEME.orangeGradientFrom} 0%, ${BOQ_THEME.orangeGradientTo} 100%)`,
                  }}
                >
                  <td colSpan={5} className="px-4 py-3">
                    <div className="flex items-center gap-2.5 text-white font-bold text-[13px]">
                      <span
                        className="h-3.5 w-3.5 rounded-full shrink-0"
                        style={{ border: "2px solid rgba(255,255,255,0.85)" }}
                      />
                      {floor.name}
                    </div>
                  </td>
                  <td
                    colSpan={2}
                    className="px-4 py-3 text-right text-white font-bold text-[13px]"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    Floor Total: {formatBoqAmount(floorTotal, currency)}
                  </td>
                </tr>

                {roomGroups.map(({ room, lines, total: roomTotal }) => (
                  <Fragment key={`room-block-${room.id}`}>
                    <tr style={{ ...BOQ_PRINT_COLOR, backgroundColor: BOQ_THEME.creamRoom }}>
                      <td colSpan={5} className="px-4 py-2.5">
                        <div className="flex items-center gap-2 font-bold text-[13px]" style={{ color: "#1f2937" }}>
                          <span className="text-[10px] shrink-0" style={{ color: BOQ_THEME.orange }}>▾</span>
                          {room.name}
                        </div>
                      </td>
                      <td
                        colSpan={2}
                        className="px-4 py-2.5 text-right font-bold text-[13px]"
                        style={{ color: "#1f2937", fontVariantNumeric: "tabular-nums" }}
                      >
                        {formatBoqAmount(roomTotal, currency)}
                      </td>
                    </tr>

                    {lines.map((line, lineIdx) => (
                      <tr
                        key={line.id}
                        style={{
                          ...BOQ_PRINT_COLOR,
                          backgroundColor: lineIdx % 2 === 1 ? BOQ_THEME.lineAlt : "#ffffff",
                          borderBottom: `1px solid ${BOQ_THEME.metaBorder}`,
                        }}
                      >
                        <td
                          className="px-4 py-3 text-xs align-middle"
                          style={{ color: "#9ca3af", fontVariantNumeric: "tabular-nums" }}
                        >
                          {line.sr}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <p className="text-[13px] font-medium" style={{ color: "#111827" }}>
                            {line.description}
                          </p>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <SurfaceBadge label={resolveSurface(line.surface, line.parent)} />
                        </td>
                        <td
                          className="px-4 py-3 text-right text-[13px] font-semibold align-middle"
                          style={{ color: "#111827", fontVariantNumeric: "tabular-nums" }}
                        >
                          {line.qty.toFixed(2)}
                        </td>
                        <td
                          className="px-4 py-3 text-right text-[13px] align-middle"
                          style={{ color: "#4b5563" }}
                        >
                          {line.unitShort || line.unit}
                        </td>
                        <td
                          className="px-4 py-3 text-right text-[13px] align-middle"
                          style={{ color: "#374151", fontVariantNumeric: "tabular-nums" }}
                        >
                          {formatBoqAmount(line.rate, currency)}
                        </td>
                        <td
                          className="px-4 py-3 text-right text-[13px] font-bold align-middle"
                          style={{ color: "#111827", fontVariantNumeric: "tabular-nums" }}
                        >
                          {formatBoqAmount(line.amount, currency)}
                        </td>
                      </tr>
                    ))}

                    <tr style={{ ...BOQ_PRINT_COLOR, backgroundColor: BOQ_THEME.roomTotalBg }}>
                      <td
                        colSpan={5}
                        className="px-4 py-2.5 text-[12px] font-semibold italic"
                        style={{ color: "#6b7280" }}
                      >
                        Room Total — {room.name}
                      </td>
                      <td
                        colSpan={2}
                        className="px-4 py-2.5 text-right text-[13px] font-bold"
                        style={{ color: "#111827", fontVariantNumeric: "tabular-nums" }}
                      >
                        {formatBoqAmount(roomTotal, currency)}
                      </td>
                    </tr>
                  </Fragment>
                ))}
              </Fragment>
            ))}

            {additionalGroups.length > 0 && (
              <Fragment key="additional-block">
                <tr
                  style={{
                    ...BOQ_PRINT_COLOR,
                    background: `linear-gradient(90deg, ${BOQ_THEME.navy} 0%, ${BOQ_THEME.navyDark} 100%)`,
                  }}
                >
                  <td colSpan={7} className="px-4 py-3 text-white font-bold text-[13px] uppercase tracking-wide">
                    Additional Charges &amp; Services
                  </td>
                </tr>

                {additionalGroups.map((group) => (
                  <Fragment key={`cat-${group.categoryCode}`}>
                    <tr style={{ ...BOQ_PRINT_COLOR, backgroundColor: BOQ_THEME.creamRoom }}>
                      <td colSpan={5} className="px-4 py-2.5">
                        <div className="flex items-center gap-2 font-bold text-[13px]" style={{ color: "#1f2937" }}>
                          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-white border">
                            {group.categoryCode}
                          </span>
                          {group.categoryName}
                        </div>
                      </td>
                      <td
                        colSpan={2}
                        className="px-4 py-2.5 text-right font-bold text-[13px]"
                        style={{ color: "#1f2937", fontVariantNumeric: "tabular-nums" }}
                      >
                        {formatBoqAmount(group.total, currency)}
                      </td>
                    </tr>

                    {group.lines.map((line, lineIdx) => (
                      <tr
                        key={line.id}
                        style={{
                          ...BOQ_PRINT_COLOR,
                          backgroundColor: lineIdx % 2 === 1 ? BOQ_THEME.lineAlt : "#ffffff",
                          borderBottom: `1px solid ${BOQ_THEME.metaBorder}`,
                        }}
                      >
                        <td
                          className="px-4 py-3 text-xs align-middle"
                          style={{ color: "#9ca3af", fontVariantNumeric: "tabular-nums" }}
                        >
                          {line.sr}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <p className="text-[13px] font-medium" style={{ color: "#111827" }}>
                            {line.description || line.categoryName}
                          </p>
                          {line.remarks && (
                            <p className="text-[10px] text-gray-500 mt-0.5">{line.remarks}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <SurfaceBadge label={line.categoryCode || "—"} />
                        </td>
                        <td
                          className="px-4 py-3 text-right text-[13px] font-semibold align-middle"
                          style={{ color: "#111827", fontVariantNumeric: "tabular-nums" }}
                        >
                          {line.qty.toFixed(2)}
                        </td>
                        <td
                          className="px-4 py-3 text-right text-[13px] align-middle"
                          style={{ color: "#4b5563" }}
                        >
                          {line.unitShort || line.unit}
                        </td>
                        <td
                          className="px-4 py-3 text-right text-[13px] align-middle"
                          style={{ color: "#374151", fontVariantNumeric: "tabular-nums" }}
                        >
                          {formatBoqAmount(line.rate, currency)}
                        </td>
                        <td
                          className="px-4 py-3 text-right text-[13px] font-bold align-middle"
                          style={{ color: "#111827", fontVariantNumeric: "tabular-nums" }}
                        >
                          {formatBoqAmount(line.amount, currency)}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </Fragment>
            )}
          </tbody>
        </table>
      </div>

      {boq.lines.length > 0 && (
        <div
          className="flex items-center justify-between px-8 py-5 border-x"
          style={{
            ...BOQ_PRINT_COLOR,
            backgroundColor: BOQ_THEME.grandTotalBg,
            borderColor: BOQ_THEME.metaBorder,
          }}
        >
          <span className="text-white font-bold text-[13px] uppercase tracking-[0.15em]">Grand Total</span>
          <span
            className="text-[26px] font-bold"
            style={{ color: BOQ_THEME.orangeLight, fontVariantNumeric: "tabular-nums" }}
          >
            {formatBoqAmount(boq.totals.grandTotal, currency)}
          </span>
        </div>
      )}

      <BoqDocumentFooter />
    </div>
  );
}
