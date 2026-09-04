import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  attachmentLabel,
  clonePdfFile,
  fetchAttachmentArrayBuffer,
  storePdfBytes,
} from "@/lib/attachments";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function PdfAttachmentPreview({ path, className = "" }) {
  const label = attachmentLabel(path);
  const sourceRef = useRef(null);
  const [inlineFile, setInlineFile] = useState(null);
  const [dialogFile, setDialogFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [inlinePages, setInlinePages] = useState(0);
  const [dialogPages, setDialogPages] = useState(0);
  const [inlineKey, setInlineKey] = useState(0);
  const [dialogKey, setDialogKey] = useState(0);

  useEffect(() => {
    sourceRef.current = null;
    setInlineFile(null);
    setDialogFile(null);
    setLoaded(false);
    setVisible(false);
    setDialogOpen(false);
    setInlinePages(0);
    setDialogPages(0);
    setInlineKey(0);
    setError("");
  }, [path]);

  const refreshInlinePreview = useCallback(() => {
    if (!sourceRef.current) return;
    setInlineFile(clonePdfFile(sourceRef.current));
    setInlinePages(0);
    setInlineKey((key) => key + 1);
  }, []);

  const ensureSource = useCallback(async () => {
    if (sourceRef.current) return true;
    setLoading(true);
    setError("");
    try {
      sourceRef.current = storePdfBytes(await fetchAttachmentArrayBuffer(path));
      setLoaded(true);
      return true;
    } catch (err) {
      let message = "Could not load PDF";
      if (err?.response?.data instanceof ArrayBuffer) {
        try {
          const text = new TextDecoder().decode(err.response.data);
          const json = JSON.parse(text);
          message = json.error || json.message || message;
        } catch {
          // ignore parse errors
        }
      } else {
        message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          message;
      }
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [path]);

  const handleViewInline = async () => {
    const ok = await ensureSource();
    if (!ok) return;
    refreshInlinePreview();
    setVisible(true);
  };

  const handleOpenDialog = async () => {
    const ok = await ensureSource();
    if (!ok) return;
    setInlineFile(null);
    setInlinePages(0);
    setDialogFile(clonePdfFile(sourceRef.current));
    setDialogPages(0);
    setDialogKey((key) => key + 1);
    setDialogOpen(true);
  };

  const handleDialogChange = (open) => {
    setDialogOpen(open);
    if (!open) {
      setDialogFile(null);
      setDialogPages(0);
      if (visible) {
        refreshInlinePreview();
      }
    }
  };

  return (
    <>
      <div className={`w-full min-w-[240px] max-w-lg basis-full ${className}`}>
        <p className="mb-1.5 truncate text-[11px] text-muted-foreground">{label}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            disabled={loading}
            onClick={handleViewInline}
          >
            {loading ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Eye className="mr-1 h-3.5 w-3.5" />
            )}
            {visible ? "Refresh preview" : "View PDF"}
          </Button>
          {loaded && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleOpenDialog}
            >
              Expand
            </Button>
          )}
        </div>
        {error && (
          <p className="mt-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}
        {visible && !dialogOpen && inlineFile && (
          <div className="mt-2 max-h-72 overflow-auto rounded-lg border bg-muted/20 p-2">
            <Document
              key={`inline-pdf-${inlineKey}`}
              file={inlineFile}
              onLoadSuccess={({ numPages }) => setInlinePages(numPages)}
              loading={
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              }
              error={<p className="p-3 text-xs text-destructive">Failed to render PDF</p>}
            >
              <Page pageNumber={1} width={460} renderTextLayer={false} renderAnnotationLayer={false} />
            </Document>
            {inlinePages > 1 && (
              <p className="mt-1 text-center text-[10px] text-muted-foreground">
                Page 1 of {inlinePages} — use Expand for all pages
              </p>
            )}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-sm font-medium">{label}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[calc(90vh-5rem)] overflow-auto px-6 pb-6">
            {dialogFile && (
              <Document
                key={`dialog-pdf-${dialogKey}`}
                file={dialogFile}
                onLoadSuccess={({ numPages }) => setDialogPages(numPages)}
                loading={
                  <div className="flex h-48 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                }
                error={<p className="p-3 text-xs text-destructive">Failed to render PDF</p>}
              >
                {dialogPages > 0 &&
                  Array.from({ length: dialogPages }, (_, i) => (
                    <Page
                      key={`dialog-page-${i + 1}`}
                      pageNumber={i + 1}
                      width={680}
                      className="mb-4"
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  ))}
              </Document>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
