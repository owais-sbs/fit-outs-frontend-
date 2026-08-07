import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PAGE_MARGIN_MM = 8;
const CONTENT_WIDTH_PX = 794;
/** html2canvas reliably renders ~this many CSS px per pass */
const CAPTURE_CHUNK_PX = 900;

const MODERN_COLOR = /oklch|oklab|lab\(|lch\(|color\(|color-mix\(/i;

const PAINT_PROPS = [
  "color",
  "backgroundColor",
  "borderTopColor",
  "borderRightColor",
  "borderBottomColor",
  "borderLeftColor",
  "outlineColor",
  "textDecorationColor",
  "caretColor",
  "columnRuleColor",
  "fill",
  "stroke",
];

/** Layout/typography that must survive class stripping for html2canvas. */
const LAYOUT_PROPS = [
  "display",
  "flexDirection",
  "flexWrap",
  "justifyContent",
  "alignItems",
  "alignContent",
  "alignSelf",
  "gap",
  "rowGap",
  "columnGap",
  "gridTemplateColumns",
  "gridTemplateRows",
  "gridColumn",
  "gridRow",
  "width",
  "minWidth",
  "maxWidth",
  "height",
  "minHeight",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "fontSize",
  "fontWeight",
  "fontFamily",
  "fontStyle",
  "lineHeight",
  "letterSpacing",
  "textAlign",
  "textTransform",
  "whiteSpace",
  "verticalAlign",
  "borderCollapse",
  "borderSpacing",
  "borderStyle",
  "borderWidth",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderRadius",
  "boxSizing",
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "flex",
  "flexGrow",
  "flexShrink",
  "flexBasis",
  "order",
  "tableLayout",
];

const SKIP_LAYOUT_VALUES = new Set(["", "normal", "auto", "none", "static", "start", "stretch"]);

/** Convert modern CSS colors (oklch, etc.) to hex/rgb that html2canvas can parse. */
function toSafeCssColor(value, property = "color") {
  if (!value || value === "transparent" || value === "rgba(0, 0, 0, 0)" || value === "none") {
    return value;
  }
  if (!MODERN_COLOR.test(value)) {
    return value;
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (ctx) {
      ctx.fillStyle = "#000000";
      ctx.fillStyle = value;
      const parsed = ctx.fillStyle;
      if (parsed && !MODERN_COLOR.test(parsed)) {
        return parsed;
      }
    }
  } catch {
    // fall through
  }

  try {
    const probe = document.createElement("span");
    probe.style.cssText =
      "position:fixed;left:-9999px;visibility:hidden;pointer-events:none;color:#000;background:#fff;";
    if (property === "backgroundColor") {
      probe.style.backgroundColor = value;
    } else {
      probe.style.color = value;
    }
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe);
    const converted =
      property === "backgroundColor" ? computed.backgroundColor : computed.color;
    document.body.removeChild(probe);
    if (converted && !MODERN_COLOR.test(converted) && converted !== "rgba(0, 0, 0, 0)") {
      return converted;
    }
  } catch {
    // fall through
  }

  return property === "backgroundColor" ? "#ffffff" : "#111827";
}

function sanitizeNodeForCanvas(root, win = window) {
  if (!root) return;

  const nodes = [root, ...root.querySelectorAll("*")];
  nodes.forEach((node) => {
    if (node.nodeType !== 1) return;
    const computed = win.getComputedStyle(node);

    // Preserve layout before removing Tailwind classes.
    LAYOUT_PROPS.forEach((prop) => {
      const val = computed[prop];
      if (val == null || SKIP_LAYOUT_VALUES.has(val)) return;
      // Avoid inlining huge computed margin:auto as 0px quirks on body clones
      if ((prop === "marginLeft" || prop === "marginRight") && val === "0px") return;
      try {
        node.style[prop] = val;
      } catch {
        // ignore
      }
    });

    PAINT_PROPS.forEach((prop) => {
      let val = computed[prop];
      if (!val || val === "rgba(0, 0, 0, 0)" || val === "none") return;
      if (MODERN_COLOR.test(val)) {
        val = toSafeCssColor(val, prop === "backgroundColor" ? "backgroundColor" : "color");
      }
      try {
        node.style[prop] = val;
      } catch {
        // ignore read-only SVG presentation attrs handled below
      }
    });

    const bgImage = computed.backgroundImage;
    if (bgImage && bgImage !== "none") {
      if (MODERN_COLOR.test(bgImage)) {
        node.style.backgroundImage = "none";
        node.style.backgroundColor = toSafeCssColor(
          computed.backgroundColor,
          "backgroundColor"
        );
      } else {
        node.style.backgroundImage = bgImage;
      }
    }

    if (node.tagName?.toLowerCase() === "svg" || node.namespaceURI?.includes("svg")) {
      ["fill", "stroke"].forEach((attr) => {
        const raw = node.getAttribute(attr) || computed[attr];
        if (raw && raw !== "none" && MODERN_COLOR.test(String(raw))) {
          node.setAttribute(attr, toSafeCssColor(String(raw)));
        }
      });
    }

    // Drop utility classes so theme tokens (often oklch) cannot re-apply.
    node.removeAttribute("class");
    node.style.boxShadow = "none";
    node.style.filter = "none";
    node.style.overflow = "visible";
    node.style.maxHeight = "none";

    // Nuclear cleanup if any unsupported color leaked into cssText.
    if (node.style?.cssText && MODERN_COLOR.test(node.style.cssText)) {
      PAINT_PROPS.forEach((prop) => {
        const inline = node.style[prop];
        if (inline && MODERN_COLOR.test(inline)) {
          node.style[prop] = toSafeCssColor(
            inline,
            prop === "backgroundColor" ? "backgroundColor" : "color"
          );
        }
      });
      if (node.style.backgroundImage && MODERN_COLOR.test(node.style.backgroundImage)) {
        node.style.backgroundImage = "none";
      }
    }
  });
}

function waitFrames(count = 2) {
  return new Promise((resolve) => {
    let n = 0;
    const tick = () => {
      n += 1;
      if (n >= count) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/** Measure true document height from live DOM (not viewport) */
function measureElementHeight(el) {
  const tableRows = el.querySelectorAll("tr");
  const rowSum = Array.from(tableRows).reduce((sum, row) => sum + row.offsetHeight, 0);
  const tableExtra = 320;

  return Math.max(
    el.scrollHeight,
    el.offsetHeight,
    el.getBoundingClientRect().height,
    tableRows.length > 0 ? rowSum + tableExtra : 0
  );
}

function mountInExportIframe(sourceElement, fullHeight) {
  const clone = sourceElement.cloneNode(true);
  clone.style.cssText = `
    width: ${CONTENT_WIDTH_PX}px;
    max-width: ${CONTENT_WIDTH_PX}px;
    height: auto;
    min-height: ${fullHeight}px;
    max-height: none;
    overflow: visible;
    display: block;
    margin: 0;
    box-shadow: none;
    border-radius: 0;
    background: #ffffff;
    color: #111827;
  `;

  const staging = document.createElement("div");
  staging.style.cssText = `position:fixed;left:-99999px;top:0;width:${CONTENT_WIDTH_PX}px;visibility:hidden;overflow:visible;`;
  staging.appendChild(clone);
  document.body.appendChild(staging);
  sanitizeNodeForCanvas(clone, window);
  document.body.removeChild(staging);

  const iframe = document.createElement("iframe");
  iframe.setAttribute("data-boq-export-iframe", "true");
  iframe.style.cssText = `
    position: fixed;
    left: -120000px;
    top: 0;
    width: ${CONTENT_WIDTH_PX}px;
    height: ${fullHeight + 80}px;
    border: none;
    visibility: hidden;
    pointer-events: none;
    overflow: visible;
  `;

  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  *, *::before, *::after { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; background: #ffffff; color: #111827; width: ${CONTENT_WIDTH_PX}px; overflow: visible !important; height: auto !important; }
  table { border-collapse: collapse; width: 100%; height: auto !important; }
  img { max-width: 100%; }
</style>
</head>
<body style="overflow:visible;height:auto;background:#ffffff;color:#111827;"></body>
</html>`);
  doc.close();

  const imported = doc.importNode(clone, true);
  imported.style.overflow = "visible";
  imported.style.minHeight = `${fullHeight}px`;
  doc.body.appendChild(imported);

  // Second pass inside the isolated iframe (no theme stylesheets).
  sanitizeNodeForCanvas(imported, iframe.contentWindow);

  imported.querySelectorAll("table, tbody, thead, tfoot").forEach((node) => {
    node.style.height = "auto";
    node.style.maxHeight = "none";
    node.style.overflow = "visible";
  });

  return { iframe, imported, win: iframe.contentWindow };
}

/**
 * html2canvas only paints ~one viewport per call — capture in vertical chunks then stitch.
 */
async function captureFullHeight(root, totalHeight, scale, win = window) {
  const chunks = [];

  for (let offsetY = 0; offsetY < totalHeight; offsetY += CAPTURE_CHUNK_PX) {
    const chunkHeight = Math.min(CAPTURE_CHUNK_PX, totalHeight - offsetY);

    const canvas = await html2canvas(root, {
      scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: CONTENT_WIDTH_PX,
      height: chunkHeight,
      windowWidth: CONTENT_WIDTH_PX,
      windowHeight: chunkHeight,
      x: 0,
      y: offsetY,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc) => {
        const target = clonedDoc.body;
        if (target) {
          sanitizeNodeForCanvas(target, clonedDoc.defaultView || win);
        }
      },
    });

    if (!canvas || canvas.height < 2) {
      throw new Error(`Chunk capture failed at offset ${offsetY}`);
    }

    chunks.push(canvas);
  }

  if (chunks.length === 1) {
    return chunks[0];
  }

  const merged = document.createElement("canvas");
  merged.width = chunks[0].width;
  merged.height = chunks.reduce((sum, c) => sum + c.height, 0);

  const ctx = merged.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, merged.width, merged.height);

  let drawY = 0;
  chunks.forEach((chunk) => {
    ctx.drawImage(chunk, 0, drawY);
    drawY += chunk.height;
  });

  return merged;
}

function addCanvasToPdf(pdf, canvas) {
  const pageInnerWidth = A4_WIDTH_MM - PAGE_MARGIN_MM * 2;
  const pageInnerHeight = A4_HEIGHT_MM - PAGE_MARGIN_MM * 2;
  const imgWidthMm = pageInnerWidth;
  const pxPerMm = canvas.width / imgWidthMm;
  const pageHeightPx = Math.floor(pageInnerHeight * pxPerMm);

  let offsetY = 0;
  let pageIndex = 0;

  while (offsetY < canvas.height) {
    const sliceHeight = Math.min(pageHeightPx, canvas.height - offsetY);

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeight;

    const ctx = pageCanvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(
      canvas,
      0,
      offsetY,
      canvas.width,
      sliceHeight,
      0,
      0,
      canvas.width,
      sliceHeight
    );

    const imgData = pageCanvas.toDataURL("image/jpeg", 0.9);
    const sliceHeightMm = sliceHeight / pxPerMm;

    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(imgData, "JPEG", PAGE_MARGIN_MM, PAGE_MARGIN_MM, imgWidthMm, sliceHeightMm);

    offsetY += sliceHeight;
    pageIndex += 1;
  }

  return pageIndex;
}

export async function downloadBoqPdf(elementId, filename = "BOQ-Invoice.pdf") {
  const element = document.getElementById(elementId);
  if (!element) {
    printBoqDocument(elementId);
    return;
  }

  let iframeMount = null;

  try {
    document.body.classList.add("boq-export-active");

    const fullHeight = measureElementHeight(element);
    if (fullHeight < 50) {
      throw new Error("Could not measure BOQ document height");
    }

    iframeMount = mountInExportIframe(element, fullHeight);
    const { imported, win } = iframeMount;

    if (win.document.fonts?.ready) {
      await win.document.fonts.ready;
    }
    await waitFrames(4);
    await new Promise((r) => setTimeout(r, 250));

    const remeasured = Math.max(fullHeight, measureElementHeight(imported));
    const scale = remeasured > 12000 ? 1.1 : remeasured > 7000 ? 1.25 : 1.5;

    const canvas = await captureFullHeight(imported, remeasured, scale, win);

    if (!canvas || canvas.height < 20) {
      throw new Error("PDF capture produced empty canvas");
    }

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageCount = addCanvasToPdf(pdf, canvas);

    if (pageCount < 1) {
      throw new Error("No PDF pages generated");
    }

    pdf.save(filename);
  } catch (err) {
    console.error("BOQ PDF export failed:", err);
    throw err;
  } finally {
    document.body.classList.remove("boq-export-active");
    if (iframeMount?.iframe?.parentNode) {
      iframeMount.iframe.parentNode.removeChild(iframeMount.iframe);
    }
  }
}

export function printBoqDocument(elementId) {
  document.body.classList.add("boq-print-active");
  const prevTitle = document.title;
  const el = document.getElementById(elementId);
  if (el?.dataset?.title) document.title = el.dataset.title;

  window.print();

  setTimeout(() => {
    document.body.classList.remove("boq-print-active");
    document.title = prevTitle;
  }, 500);
}
