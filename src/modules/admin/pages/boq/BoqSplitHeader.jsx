import { BOQ_THEME, BOQ_PRINT_COLOR } from "./boqTheme";

/**
 * Orange / navy split banner — single gradient background (no clip-path gap).
 */
export default function BoqSplitHeader({ left, right, minHeight = 150, className = "" }) {
  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{
        ...BOQ_PRINT_COLOR,
        minHeight,
        background: `linear-gradient(105deg, ${BOQ_THEME.orange} 0%, ${BOQ_THEME.orangeLight} 44%, ${BOQ_THEME.navy} 44%, ${BOQ_THEME.navy} 100%)`,
      }}
    >
      <div className="flex" style={{ minHeight }}>
        <div
          className="flex flex-col justify-center shrink-0 text-white"
          style={{
            width: "46%",
            minWidth: "280px",
            padding: "22px 24px 22px 20px",
          }}
        >
          {left}
        </div>
        <div
          className="flex flex-1 flex-col justify-center text-right text-white"
          style={{ padding: "22px 32px 22px 16px" }}
        >
          {right}
        </div>
      </div>
    </div>
  );
}
