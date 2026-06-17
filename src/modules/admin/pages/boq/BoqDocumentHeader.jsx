import { BOQ_THEME, COMPANY, formatBoqDate, BOQ_PRINT_COLOR } from "./boqTheme";
import BoqSplitHeader from "./BoqSplitHeader";

export default function BoqDocumentHeader({
  variant = "invoice",
  refCode,
  generatedAt,
  qasRef,
}) {
  const titleAccent = variant === "review" ? "REVIEW" : "INVOICE";
  const titlePrefix = variant === "review" ? "QAS" : "BOQ";

  return (
    <BoqSplitHeader
      className="boq-doc-header"
      left={
        <>
          <h1 className="text-[22px] font-bold tracking-tight leading-tight">{COMPANY.name}</h1>
          <p className="text-[11px] text-white/95 mt-1">{COMPANY.tagline}</p>
          <div className="mt-4 space-y-0.5 text-[10px] text-white/85 leading-relaxed">
            <p>{COMPANY.address}</p>
            <p>{COMPANY.email}</p>
            <p>{COMPANY.phone}</p>
          </div>
        </>
      }
      right={
        <>
          <h2 className="text-[32px] font-bold tracking-wide leading-none">
            <span className="text-white">{titlePrefix} </span>
            <span style={{ color: BOQ_THEME.orangeLight }}>{titleAccent}</span>
          </h2>
          <p
            className="font-mono text-[15px] font-semibold mt-4 tracking-wide"
            style={{ color: BOQ_THEME.orangeLight }}
          >
            {refCode}
          </p>
          {qasRef && variant === "invoice" && (
            <p className="text-[10px] text-white/45 mt-1.5 font-mono">QAS: {qasRef}</p>
          )}
          <p className="text-[11px] text-white/55 mt-1">
            {variant === "review" ? "Assessed" : "Generated"}: {formatBoqDate(generatedAt)}
          </p>
        </>
      }
    />
  );
}

export function BoqMetaBar({ items }) {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-x border-b"
      style={{
        ...BOQ_PRINT_COLOR,
        borderColor: BOQ_THEME.metaBorder,
        backgroundColor: BOQ_THEME.metaBg,
      }}
    >
      {items.map(({ label, value, highlight }, idx) => (
        <div
          key={label}
          className="px-5 py-3.5 min-w-0"
          style={{
            borderRight: idx < items.length - 1 ? `1px solid ${BOQ_THEME.metaBorder}` : undefined,
          }}
        >
          <p
            className="text-[9px] font-bold uppercase tracking-[0.12em] mb-1.5"
            style={{ color: BOQ_THEME.metaLabel }}
          >
            {label}
          </p>
          <p
            className="text-[15px] font-bold truncate leading-tight"
            style={{
              color: highlight ? BOQ_THEME.orange : "#111827",
            }}
          >
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function BoqDocumentFooter() {
  return (
    <div
      className="px-8 py-5 flex flex-wrap items-center justify-between gap-4"
      style={{
        ...BOQ_PRINT_COLOR,
        backgroundColor: BOQ_THEME.navyDark,
      }}
    >
      <p className="max-w-xl text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
        This document is system-generated and is valid without a physical signature. All quantities are based on site
        measurements captured in the QAS workflow.
      </p>
      <p className="font-bold text-[15px] shrink-0" style={{ color: BOQ_THEME.orangeLight }}>
        {COMPANY.name}
      </p>
    </div>
  );
}
