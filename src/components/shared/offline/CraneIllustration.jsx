import "./crane.css";

const GRID_X = [20, 50, 80, 110, 140, 170, 200, 230, 260, 290, 320];
const GRID_Y = [20, 50, 80, 110, 140, 170];

/**
 * Tower crane whose load drops when the connection is lost.
 * Pure SVG + CSS keyframes; remount (via key) to replay the sequence.
 */
export default function CraneIllustration() {
  return (
    <svg
      className="oc-scene"
      viewBox="0 0 360 200"
      role="img"
      aria-label="Illustration of a tower crane whose cable has snapped, dropping its load to the ground"
      focusable="false"
    >
      <g className="oc-shake">
        <g aria-hidden="true">
          {GRID_X.map((x) => (
            <line key={`gx-${x}`} className="oc-grid-line" x1={x} y1="8" x2={x} y2="176" />
          ))}
          {GRID_Y.map((y) => (
            <line key={`gy-${y}`} className="oc-grid-line" x1="14" y1={y} x2="346" y2={y} />
          ))}
        </g>

        <line className="oc-ground" x1="16" y1="176" x2="344" y2="176" />

        {/* mast */}
        <path className="oc-steel" d="M58 176V40M76 176V40" />
        <path
          className="oc-brace"
          d="M58 160l18-20M76 160l-18-20M58 128l18-20M76 128l-18-20M58 96l18-20M76 96l-18-20M58 64l18-20M76 64l-18-20"
        />
        <path className="oc-steel" d="M48 176l10-12h18l10 12" />

        <g className="oc-jib">
          {/* counter jib, jib, A-frame */}
          <path className="oc-steel" d="M30 36h270" />
          <path className="oc-brace" d="M44 36l14-22M90 36l-14-22M120 36l-14-22M150 36l-14-22M180 36l-14-22M210 36l-14-22M240 36l-14-22M270 36l-14-22" />
          <path className="oc-steel" d="M58 36L67 12l9 24" />
          <path className="oc-brace" d="M67 12L34 30M67 12l188 20" />
          <rect className="oc-steel-fill" x="24" y="26" width="18" height="20" rx="3" />
          <rect className="oc-blue-fill" x="78" y="36" width="22" height="17" rx="3" />
          <circle className="oc-lamp" cx="67" cy="9" r="4.5" />
          <rect className="oc-steel-fill" x="221" y="31" width="18" height="8" rx="2" />

          <line className="oc-cable oc-cable-intact" x1="230" y1="40" x2="230" y2="74" />
          <path className="oc-cable oc-severed" d="M230 40c0 10 3 14 2 22" />
          <circle className="oc-spark" cx="230" cy="62" r="6" />
        </g>

        <g className="oc-sway">
          <g className="oc-motion" aria-hidden="true">
            <line className="oc-motion-line" x1="212" y1="52" x2="212" y2="66" />
            <line className="oc-motion-line" x1="230" y1="46" x2="230" y2="64" />
            <line className="oc-motion-line" x1="248" y1="52" x2="248" y2="66" />
          </g>

          <g className="oc-fall">
            <g className="oc-tumble">
              <rect className="oc-crate-body" x="206" y="76" width="48" height="42" rx="4" />
              <path className="oc-crate-band" d="M206 86h48M206 108h48" />

              {/* lucide Wifi drawn at 24x24, centred in the crate */}
              <g transform="translate(218 85)">
                <path className="oc-wifi" d="M12 20h.01" />
                <path className="oc-wifi" d="M2 8.82a15 15 0 0 1 20 0" />
                <path className="oc-wifi" d="M5 12.859a10 10 0 0 1 14 0" />
                <path className="oc-wifi" d="M8.5 16.429a5 5 0 0 1 7 0" />
                <path className="oc-wifi-slash" d="M2 2l20 20" />
              </g>
            </g>
          </g>
        </g>

        <g className="oc-dust" aria-hidden="true">
          <ellipse cx="196" cy="172" rx="14" ry="6" />
          <ellipse cx="264" cy="172" rx="12" ry="5" />
          <ellipse cx="230" cy="168" rx="20" ry="7" />
        </g>

        <g className="oc-barrier">
          <path className="oc-steel" d="M286 176v-14M334 176v-14" />
          <rect className="oc-crate-body" x="278" y="146" width="64" height="18" rx="3" />
          <g>
            <clipPath id="oc-barrier-clip">
              <rect x="280" y="148" width="60" height="14" rx="2" />
            </clipPath>
            <g clipPath="url(#oc-barrier-clip)">
              <path
                className="oc-hazard-fill"
                d="M276 148h10l-14 14h-10zM296 148h10l-14 14h-10zM316 148h10l-14 14h-10zM336 148h10l-14 14h-10z"
              />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}
