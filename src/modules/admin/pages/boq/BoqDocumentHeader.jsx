import { PLATFORM_ICON_URL } from "@/components/brand/BrandMark";
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
          <div className="mb-3 flex items-center gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1.5 shadow-sm"
              style={{ ...BOQ_PRINT_COLOR }}
            >
              <img
                src={PLATFORM_ICON_URL}
                alt={COMPANY.name}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-[20px] font-bold leading-tight tracking-tight">{COMPANY.name}</h1>
              <p className="mt-0.5 text-[11px] text-white/95">{COMPANY.tagline}</p>
            </div>
          </div>
          <div className="mt-2 space-y-0.5 text-[10px] leading-relaxed text-white/85">
            <p>{COMPANY.address}</p>
            <p>{COMPANY.email}</p>
            <p>{COMPANY.phone}</p>
          </div>
        </>
      }
      right={
        <>
          <h2 className="text-[32px] font-bold leading-none tracking-wide">
            <span className="text-white">{titlePrefix} </span>
            <span style={{ color: BOQ_THEME.orangeLight }}>{titleAccent}</span>
          </h2>
          <p
            className="mt-4 font-mono text-[15px] font-semibold tracking-wide"
            style={{ color: BOQ_THEME.orangeLight }}
          >
            {refCode}
          </p>
          {qasRef && variant === "invoice" && (
            <p className="mt-1.5 font-mono text-[10px] text-white/45">QAS: {qasRef}</p>
          )}
          <p className="mt-1 text-[11px] text-white/55">
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
      className="grid grid-cols-2 border-x border-b sm:grid-cols-3 lg:grid-cols-5"
      style={{
        ...BOQ_PRINT_COLOR,
        borderColor: BOQ_THEME.metaBorder,
        backgroundColor: BOQ_THEME.metaBg,
      }}
    >
      {items.map(({ label, value, highlight }, idx) => (
        <div
          key={label}
          className="min-w-0 px-5 py-3.5"
          style={{
            borderRight: idx < items.length - 1 ? `1px solid ${BOQ_THEME.metaBorder}` : undefined,
          }}
        >
          <p
            className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.12em]"
            style={{ color: BOQ_THEME.metaLabel }}
          >
            {label}
          </p>
          <p
            className="truncate text-[15px] font-bold leading-tight"
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
      className="flex flex-wrap items-center justify-between gap-4 px-8 py-5"
      style={{
        ...BOQ_PRINT_COLOR,
        backgroundColor: BOQ_THEME.navyDark,
      }}
    >
      <p className="max-w-xl text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
        This document is system-generated and is valid without a physical signature. All quantities are based on site
        measurements captured in the QAS workflow.
      </p>
      <p className="shrink-0 text-[15px] font-bold" style={{ color: BOQ_THEME.orangeLight }}>
        {COMPANY.name}
      </p>
    </div>
  );
}
