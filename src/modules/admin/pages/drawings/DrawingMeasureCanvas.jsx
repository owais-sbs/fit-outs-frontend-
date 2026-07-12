import React, { useRef, useState, useEffect, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { DxfViewer } from "dxf-viewer";
import * as THREE from "three";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pixelDistance, polygonArea, polylineLength, sceneToCanvas } from "./drawingQtoUtils";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const DXF_LOAD_PHASE_LABELS = {
  fetch: "Downloading drawing",
  parse: "Parsing DXF",
  prepare: "Preparing geometry",
  font: "Loading fonts",
};

function createDxfWorker() {
  return new Worker(new URL("../../../../workers/dxfViewer.worker.js", import.meta.url));
}

function safeDxfSubscribe(viewer, eventName, handler) {
  if (!viewer?.HasRenderer?.()) return;
  try {
    viewer.Subscribe(eventName, handler);
  } catch {
    // viewer not ready
  }
}

function safeDxfUnsubscribe(viewer, eventName, handler) {
  if (!viewer?.HasRenderer?.()) return;
  try {
    viewer.Unsubscribe(eventName, handler);
  } catch {
    // renderer already destroyed
  }
}

const TOOLS = [
  { id: "pan", label: "Move" },
  { id: "scale", label: "Scale" },
  { id: "area", label: "Area" },
  { id: "length", label: "Length" },
  { id: "count", label: "Count" },
];

export const MEASURE_TOOLS = TOOLS.filter((t) => t.id !== "pan");

export default function DrawingMeasureCanvas({
  previewUrl,
  previewType = "pdf",
  scaleRatio,
  onScaleCalibrated,
  activeTool,
  onMeasurementComplete,
}) {
  const canvasRef = useRef(null);
  const scrollRef = useRef(null);
  const dxfContainerRef = useRef(null);
  const dxfViewerRef = useRef(null);
  const pageRefs = useRef({});
  const [points, setPoints] = useState([]);
  const [scalePoints, setScalePoints] = useState([]);
  const [scaleDistance, setScaleDistance] = useState("");
  const [containerWidth, setContainerWidth] = useState(800);
  const [numPages, setNumPages] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [pageSize, setPageSize] = useState({ width: 800, height: 600 });
  const [dxfLoading, setDxfLoading] = useState(false);
  const [dxfError, setDxfError] = useState("");
  const [dxfProgress, setDxfProgress] = useState({ phase: "", percent: 0 });

  const pageWidth = Math.round(containerWidth * zoom);
  const isDxf = previewType === "dxf";

  useEffect(() => {
    if (!isDxf || !previewUrl) {
      return undefined;
    }

    let active = true;
    let viewer = null;
    const containerRef = dxfContainerRef;

    const mountViewer = () => {
      const container = containerRef.current;
      if (!active || !container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width < 20 || height < 20) {
        requestAnimationFrame(mountViewer);
        return;
      }

      container.replaceChildren();
      setDxfLoading(true);
      setDxfError("");
      setDxfProgress({ phase: "fetch", percent: 0 });

      viewer = new DxfViewer(container, {
        autoResize: true,
        canvasAlpha: false,
        clearColor: new THREE.Color("#ffffff"),
        retainParsedDxf: false,
        sceneOptions: {
          suppressPaperSpace: true,
        },
      });

      if (!viewer.HasRenderer()) {
        setDxfError("WebGL is not available in this browser.");
        setDxfLoading(false);
        return;
      }

      dxfViewerRef.current = viewer;

      viewer
        .Load({
          url: previewUrl,
          workerFactory: createDxfWorker,
          progressCbk: (phase, processedSize, totalSize) => {
            if (!active) return;
            const percent =
              totalSize > 0 ? Math.min(99, Math.round((processedSize / totalSize) * 100)) : 0;
            setDxfProgress({ phase, percent });
          },
        })
        .then(() => {
          if (!active || dxfViewerRef.current !== viewer) return;
          const w = container.clientWidth || width;
          const h = container.clientHeight || height;
          if (w > 0 && h > 0) {
            viewer.SetSize(w, h);
          }
          const bounds = viewer.GetBounds();
          const origin = viewer.GetOrigin();
          if (bounds) {
            viewer.FitView(
              bounds.minX - origin.x,
              bounds.maxX - origin.x,
              bounds.minY - origin.y,
              bounds.maxY - origin.y
            );
          }
          viewer.Render();
          setPageSize({ width: w, height: h });
          setDxfProgress({ phase: "", percent: 100 });
          setDxfLoading(false);
        })
        .catch((err) => {
          if (!active) return;
          const message = err?.message || "Could not load DXF preview";
          const isMemoryError = /allocation failed|out of memory|Array buffer/i.test(message);
          setDxfError(
            isMemoryError
              ? "This drawing is too complex for in-browser DXF rendering. Use “Regenerate preview” to create a PNG preview."
              : message
          );
          setDxfLoading(false);
        });
    };

    requestAnimationFrame(mountViewer);

    return () => {
      active = false;
      if (viewer?.HasRenderer?.()) {
        viewer.Destroy();
      }
      if (dxfViewerRef.current === viewer) {
        dxfViewerRef.current = null;
      }
      containerRef.current?.replaceChildren();
    };
  }, [previewUrl, isDxf]);

  useEffect(() => {
    const viewer = dxfViewerRef.current;
    if (!viewer?.controls || dxfLoading) return;
    viewer.controls.enablePan = activeTool === "pan";
    viewer.controls.enableZoom = true;
  }, [activeTool, dxfLoading, isDxf]);

  const handleDxfPoint = useCallback(
    (position) => {
      const point = { x: position.x, y: position.y };

      if (activeTool === "scale") {
        const next = [...scalePoints, point].slice(-2);
        setScalePoints(next);
        if (next.length === 2 && scaleDistance) {
          const world = pixelDistance(next[0], next[1]);
          const real = parseFloat(scaleDistance);
          if (world > 0 && real > 0) {
            onScaleCalibrated(real / world);
            setScalePoints([]);
          }
        }
        return;
      }

      if (activeTool === "count") {
        const next = [...points, point];
        setPoints(next);
        onMeasurementComplete({
          tool: "count",
          page: 1,
          points: next,
          quantity: next.length,
          coordSpace: "world",
        });
        return;
      }

      setPoints((prev) => [...prev, point]);
    },
    [activeTool, scalePoints, scaleDistance, points, onScaleCalibrated, onMeasurementComplete]
  );

  useEffect(() => {
    if (!isDxf || dxfLoading || activeTool === "pan") return undefined;
    const viewer = dxfViewerRef.current;
    if (!viewer) return undefined;

    const onPointerDown = (e) => {
      const { position, domEvent } = e.detail || {};
      if (!position || domEvent?.button !== 0) return;
      handleDxfPoint(position);
    };

    safeDxfSubscribe(viewer, "pointerdown", onPointerDown);
    return () => safeDxfUnsubscribe(viewer, "pointerdown", onPointerDown);
  }, [isDxf, dxfLoading, activeTool, handleDxfPoint, previewUrl]);

  const fitDxfView = useCallback(() => {
    const viewer = dxfViewerRef.current;
    if (!viewer) return;
    const bounds = viewer.GetBounds();
    const origin = viewer.GetOrigin();
    if (bounds) {
      viewer.FitView(
        bounds.minX - origin.x,
        bounds.maxX - origin.x,
        bounds.minY - origin.y,
        bounds.maxY - origin.y
      );
      viewer.Render();
    }
  }, []);

  const zoomDxf = useCallback((factor) => {
    const viewer = dxfViewerRef.current;
    if (!viewer) return;
    const cam = viewer.GetCamera();
    const width = cam.right - cam.left;
    viewer.SetView({ x: cam.position.x, y: cam.position.y }, width / factor);
    viewer.Render();
  }, []);

  useEffect(() => {
    if (activeTool === "pan") {
      setPoints([]);
      setScalePoints([]);
    }
  }, [activeTool]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const resize = () => setContainerWidth(el.clientWidth || 800);
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#2563eb";
    ctx.fillStyle = "rgba(37, 99, 235, 0.15)";
    ctx.lineWidth = 2;

    const pts = activeTool === "scale" ? scalePoints : points;
    const viewer = dxfViewerRef.current;
    const screenPts =
      isDxf && viewer
        ? pts.map((p) => sceneToCanvas(viewer, p.x, p.y, THREE))
        : pts;

    if (screenPts.length > 0) {
      ctx.beginPath();
      ctx.moveTo(screenPts[0].x, screenPts[0].y);
      screenPts.forEach((p) => ctx.lineTo(p.x, p.y));
      if (activeTool === "area" && screenPts.length > 2) {
        ctx.closePath();
        ctx.fill();
      }
      ctx.stroke();
      screenPts.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#2563eb";
        ctx.fill();
      });
    }
  }, [points, scalePoints, activeTool, isDxf]);

  useEffect(() => {
    draw();
  }, [draw, pageSize, activePage]);

  useEffect(() => {
    if (!isDxf || dxfLoading) return undefined;
    const viewer = dxfViewerRef.current;
    if (!viewer) return undefined;

    const redraw = () => {
      const container = dxfContainerRef.current;
      if (container) {
        setPageSize({
          width: container.clientWidth || 800,
          height: container.clientHeight || 560,
        });
      }
      requestAnimationFrame(() => draw());
    };

    safeDxfSubscribe(viewer, "viewChanged", redraw);
    safeDxfSubscribe(viewer, "resized", redraw);
    return () => {
      safeDxfUnsubscribe(viewer, "viewChanged", redraw);
      safeDxfUnsubscribe(viewer, "resized", redraw);
    };
  }, [isDxf, dxfLoading, draw, previewUrl]);

  const scrollToPage = useCallback((page) => {
    const node = pageRefs.current[page];
    if (node && scrollRef.current) {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const goToPage = (page) => {
    const next = Math.min(Math.max(page, 1), numPages || 1);
    setActivePage(next);
    setPoints([]);
    setScalePoints([]);
    scrollToPage(next);
  };

  const handleClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    if (activeTool === "scale") {
      const next = [...scalePoints, point].slice(-2);
      setScalePoints(next);
      if (next.length === 2 && scaleDistance) {
        const px = pixelDistance(next[0], next[1]);
        const real = parseFloat(scaleDistance);
        if (px > 0 && real > 0) {
          onScaleCalibrated(real / px);
          setScalePoints([]);
        }
      }
      return;
    }

    if (activeTool === "count") {
      const next = [...points, point];
      setPoints(next);
      onMeasurementComplete({
        tool: "count",
        page: activePage,
        points: next,
        quantity: next.length,
      });
      return;
    }

    setPoints((prev) => [...prev, point]);
  };

  const finishShape = () => {
    if (points.length < 2) return;
    let quantity = 0;
    if (activeTool === "area") {
      quantity = scaleRatio ? polygonArea(points) * scaleRatio * scaleRatio : 0;
    } else if (activeTool === "length") {
      quantity = scaleRatio ? polylineLength(points) * scaleRatio : 0;
    }
    onMeasurementComplete({
      tool: activeTool,
      page: activePage,
      points: [...points],
      quantity: parseFloat(quantity.toFixed(2)),
      coordSpace: isDxf ? "world" : "screen",
    });
    setPoints([]);
  };

  const isSvg = previewType === "svg";
  const isRaster = previewType === "png" || previewType === "jpeg";

  if (!previewUrl) {
    return <p className="text-xs text-muted-foreground">Loading drawing preview…</p>;
  }

  const measurementActions = activeTool !== "scale" && activeTool !== "count" && (
    <div className="flex gap-2">
      <Button type="button" size="sm" variant="outline" onClick={() => setPoints([])}>
        Clear
      </Button>
      <Button type="button" size="sm" onClick={finishShape} disabled={points.length < 2}>
        Finish measurement
      </Button>
    </div>
  );

  const scaleBanner = scaleRatio > 0 && (
    <p className="text-xs text-emerald-600 font-medium">
      Scale calibrated: {scaleRatio.toFixed(6)} {isDxf ? "m/drawing unit" : "m/px"}
    </p>
  );

  if (isDxf) {
    return (
      <div className="space-y-3">
        {activeTool === "scale" && (
          <div className="flex items-end gap-2">
            <div className="space-y-1 flex-1">
              <Label className="text-xs">Real distance between 2 clicks (meters)</Label>
              <Input
                type="number"
                step="0.01"
                value={scaleDistance}
                onChange={(e) => setScaleDistance(e.target.value)}
                placeholder="e.g. 5.0"
              />
            </div>
            <p className="text-xs text-muted-foreground pb-2">Click 2 points on drawing</p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {activeTool === "pan"
              ? "Drag to pan · scroll to zoom"
              : "Scroll to zoom · click to place points"}
          </span>
          <div className="flex items-center gap-1">
            <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={fitDxfView}>
              Fit
            </Button>
            <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => zoomDxf(0.8)}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => zoomDxf(1.25)}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {dxfError && <p className="text-xs text-destructive">{dxfError}</p>}

        <div
          ref={scrollRef}
          className="border rounded-lg bg-white h-[70vh] overflow-hidden relative"
        >
          <div ref={dxfContainerRef} className="absolute inset-0 w-full h-full" />
          {dxfLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-xs text-muted-foreground bg-background/80 z-20 px-6">
              <p>
                {DXF_LOAD_PHASE_LABELS[dxfProgress.phase] || "Loading DXF"}
                … (large files may take a minute)
              </p>
              {dxfProgress.percent > 0 && (
                <div className="w-full max-w-xs">
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-200"
                      style={{ width: `${dxfProgress.percent}%` }}
                    />
                  </div>
                  <p className="mt-1 text-center text-[10px]">{dxfProgress.percent}%</p>
                </div>
              )}
            </div>
          )}
          {!dxfLoading && !dxfError && activeTool !== "pan" && (
            <canvas
              ref={canvasRef}
              width={pageSize.width}
              height={pageSize.height}
              className="absolute inset-0 z-10 pointer-events-none"
            />
          )}
        </div>

        {measurementActions}
        {scaleBanner}
      </div>
    );
  }

  const zoomControls = (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="h-7 w-7"
        onClick={() => setZoom((z) => Math.max(0.5, parseFloat((z - 0.25).toFixed(2))))}
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(zoom * 100)}%</span>
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="h-7 w-7"
        onClick={() => setZoom((z) => Math.min(3, parseFloat((z + 0.25).toFixed(2))))}
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
    </div>
  );

  if (isSvg || isRaster) {
    return (
      <div className="space-y-3">
        {activeTool === "scale" && (
          <div className="flex items-end gap-2">
            <div className="space-y-1 flex-1">
              <Label className="text-xs">Real distance between 2 clicks (meters)</Label>
              <Input
                type="number"
                step="0.01"
                value={scaleDistance}
                onChange={(e) => setScaleDistance(e.target.value)}
                placeholder="e.g. 5.0"
              />
            </div>
            <p className="text-xs text-muted-foreground pb-2">Click 2 points on drawing</p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">DWG preview (converted)</span>
          {zoomControls}
        </div>

        <p className="text-xs text-muted-foreground">
          Scroll inside the viewer to pan around the drawing.
        </p>

        <div ref={scrollRef} className="border rounded-lg bg-muted/30 max-h-[70vh] overflow-auto">
          <div className="relative mx-auto ring-2 ring-primary ring-offset-2" style={{ width: pageWidth }}>
            <img
              src={previewUrl}
              alt="Drawing preview"
              className="block w-full h-auto select-none"
              draggable={false}
              onLoad={(e) => {
                setPageSize({
                  width: Math.floor(e.currentTarget.clientWidth),
                  height: Math.floor(e.currentTarget.clientHeight),
                });
              }}
            />
            <canvas
              ref={canvasRef}
              width={pageSize.width}
              height={pageSize.height}
              className="absolute inset-0 z-10 cursor-crosshair"
              onClick={handleClick}
            />
          </div>
        </div>

        {measurementActions}
        {scaleBanner}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeTool === "scale" && (
        <div className="flex items-end gap-2">
          <div className="space-y-1 flex-1">
            <Label className="text-xs">Real distance between 2 clicks (meters)</Label>
            <Input
              type="number"
              step="0.01"
              value={scaleDistance}
              onChange={(e) => setScaleDistance(e.target.value)}
              placeholder="e.g. 5.0"
            />
          </div>
          <p className="text-xs text-muted-foreground pb-2">Click 2 points on drawing</p>
        </div>
      )}

        <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-7 w-7"
            disabled={activePage <= 1}
            onClick={() => goToPage(activePage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground min-w-[72px] text-center">
            Page {activePage}{numPages ? ` / ${numPages}` : ""}
          </span>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-7 w-7"
            disabled={!numPages || activePage >= numPages}
            onClick={() => goToPage(activePage + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {zoomControls}
      </div>

      <p className="text-xs text-muted-foreground">
        Scroll inside the viewer to move through pages. Measurements apply to the highlighted page.
      </p>

      <div
        ref={scrollRef}
        className="border rounded-lg bg-muted/30 max-h-[70vh] overflow-auto"
      >
        <Document
          file={previewUrl}
          onLoadSuccess={({ numPages: total }) => {
            setNumPages(total);
            setActivePage(1);
          }}
          loading={<p className="p-4 text-xs text-muted-foreground">Loading PDF…</p>}
          error={<p className="p-4 text-xs text-destructive">Could not load PDF preview.</p>}
        >
          {Array.from({ length: numPages }, (_, index) => {
            const pageNumber = index + 1;
            const isActive = pageNumber === activePage;
            return (
              <div
                key={pageNumber}
                ref={(node) => {
                  pageRefs.current[pageNumber] = node;
                }}
                className={`relative mx-auto mb-4 last:mb-0 ${
                  isActive ? "ring-2 ring-primary ring-offset-2" : "opacity-80"
                }`}
                style={{ width: pageWidth }}
                onClick={() => {
                  if (!isActive) goToPage(pageNumber);
                }}
              >
                <Page
                  pageNumber={pageNumber}
                  width={pageWidth}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  onLoadSuccess={(page) => {
                    if (isActive) {
                      const viewport = page.getViewport({ scale: 1 });
                      const scale = pageWidth / viewport.width;
                      const scaled = page.getViewport({ scale });
                      setPageSize({
                        width: Math.floor(scaled.width),
                        height: Math.floor(scaled.height),
                      });
                    }
                  }}
                />
                {isActive && (
                  <canvas
                    ref={canvasRef}
                    width={pageSize.width}
                    height={pageSize.height}
                    className="absolute inset-0 z-10 cursor-crosshair"
                    onClick={handleClick}
                  />
                )}
              </div>
            );
          })}
        </Document>
      </div>

      {measurementActions}
      {scaleBanner}
    </div>
  );
}

export { TOOLS };
