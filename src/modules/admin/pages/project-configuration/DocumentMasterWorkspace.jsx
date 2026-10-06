import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import { ArrowRight, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  attachmentHref,
  attachmentLabel,
  clonePdfFile,
  fetchAttachmentArrayBuffer,
  isImagePath,
  isPdfPath,
  storePdfBytes,
} from "@/lib/attachments";
import { ROUTES } from "@/shared/constants/routes";
import { fetchCompanyCompliance } from "../../api/approvals.api";
import {
  createDocumentType,
  saveDocumentRegister,
  updateDocumentType,
  uploadDocumentMasterFile,
} from "../../api/approvals-config.api";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp";

export function isCompanyHeldCategory(category) {
  const value = String(category || "").trim().toLowerCase();
  return value === "company" || value === "insurance";
}

function emptyDraft() {
  return {
    docCode: "",
    name: "",
    category: "Company",
    sourceOwner: "Contractor",
    typicallyRequiredFor: "",
    expiryTracked: true,
    active: true,
  };
}

function FilePreview({ path }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setPdfFile(null);
    setError("");
    if (!path || !isPdfPath(path)) return undefined;
    fetchAttachmentArrayBuffer(path)
      .then((buffer) => {
        if (!cancelled) setPdfFile(clonePdfFile(storePdfBytes(buffer)));
      })
      .catch(() => {
        if (!cancelled) setError("Preview unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!path) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border/70 bg-secondary/30 text-sm text-muted-foreground">
        No file yet
      </div>
    );
  }

  if (isImagePath(path)) {
    return (
      <a href={attachmentHref(path)} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border bg-secondary/30">
        <img src={attachmentHref(path)} alt={attachmentLabel(path)} className="max-h-72 w-full object-contain" />
      </a>
    );
  }

  if (isPdfPath(path)) {
    return (
      <div className="overflow-hidden rounded-xl border bg-secondary/30">
        {error && <p className="p-4 text-sm text-muted-foreground">{error}</p>}
        {!error && !pdfFile && (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening preview
          </div>
        )}
        {pdfFile && (
          <Document file={pdfFile} loading={null} error={<p className="p-4 text-sm text-muted-foreground">Preview unavailable</p>}>
            <Page pageNumber={1} width={420} renderTextLayer={false} renderAnnotationLayer={false} />
          </Document>
        )}
        <a href={attachmentHref(path)} target="_blank" rel="noreferrer" className="block truncate border-t px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
          {attachmentLabel(path)}
        </a>
      </div>
    );
  }

  return (
    <a href={attachmentHref(path)} target="_blank" rel="noreferrer" className="block rounded-xl border px-4 py-6 text-sm hover:bg-secondary/40">
      {attachmentLabel(path)}
    </a>
  );
}

export default function DocumentMasterWorkspace({ documents, loading, onChanged, onDelete, showToast }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [compliance, setCompliance] = useState([]);
  const [details, setDetails] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const loadCompliance = useCallback(async () => {
    try {
      const rows = await fetchCompanyCompliance();
      setCompliance(Array.isArray(rows) ? rows : []);
    } catch {
      setCompliance([]);
    }
  }, []);

  useEffect(() => {
    loadCompliance();
  }, [loadCompliance]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return documents;
    return documents.filter((row) =>
      [row.docCode, row.name].some((value) => String(value || "").toLowerCase().includes(needle))
    );
  }, [documents, query]);

  useEffect(() => {
    if (creating) return;
    if (selectedId && documents.some((row) => row.id === selectedId)) return;
    setSelectedId(documents[0]?.id || null);
  }, [documents, selectedId, creating]);

  const selected = documents.find((row) => row.id === selectedId) || null;
  const held = useMemo(() => {
    if (!selected?.docCode) return null;
    const code = selected.docCode.toUpperCase();
    return compliance.find((row) => String(row.documentTypeCode || "").toUpperCase() === code) || null;
  }, [compliance, selected]);

  useEffect(() => {
    if (!selected || creating) return;
    setDetails({
      docCode: selected.docCode || "",
      name: selected.name || "",
      category: selected.category || "",
      sourceOwner: selected.sourceOwner || "",
      typicallyRequiredFor: selected.typicallyRequiredFor || "",
      expiryTracked: !!selected.expiryTracked,
      active: selected.active !== false,
      referenceNo: held?.referenceNo || "",
      issueDate: held?.issueDate || "",
      expiryDate: held?.expiryDate || "",
      filePath: held?.filePath || "",
      status: held?.status || "MISSING",
    });
  }, [selected, held, creating]);

  const companyHeld = isCompanyHeldCategory(creating ? draft.category : details?.category);

  const saveCatalogue = async () => {
    if (!details || !selected) return;
    setBusy(true);
    try {
      await updateDocumentType(selected.id, {
        docCode: details.docCode,
        name: details.name,
        category: details.category,
        sourceOwner: details.sourceOwner,
        typicallyRequiredFor: details.typicallyRequiredFor,
        expiryTracked: !!details.expiryTracked,
        active: !!details.active,
      });
      if (companyHeld) {
        await saveDocumentRegister(selected.id, {
          referenceNo: details.referenceNo || null,
          issueDate: details.issueDate || null,
          expiryDate: details.expiryDate || null,
        });
        await loadCompliance();
      }
      showToast("success", "Saved", "Document details updated.");
      await onChanged();
    } catch (err) {
      showToast("error", "Save failed", err.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  };

  const createRow = async () => {
    setBusy(true);
    try {
      const created = await createDocumentType(draft);
      showToast("success", "Added", "Document added to the catalogue.");
      setCreating(false);
      setDraft(emptyDraft());
      if (created?.id) setSelectedId(created.id);
      await onChanged();
    } catch (err) {
      showToast("error", "Could not add", err.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  };

  const uploadFile = async (file) => {
    if (!file || !selected) return;
    setBusy(true);
    try {
      const saved = await uploadDocumentMasterFile(selected.id, file, {
        expiryDate: details?.expiryDate,
        issueDate: details?.issueDate,
        referenceNo: details?.referenceNo,
      });
      setDetails((prev) => prev && ({
        ...prev,
        filePath: saved?.filePath || prev.filePath,
        expiryDate: saved?.expiryDate || prev.expiryDate,
        issueDate: saved?.issueDate || prev.issueDate,
        status: saved?.status || prev.status,
      }));
      await loadCompliance();
      showToast("success", "File saved", "Projects will use this copy.");
    } catch (err) {
      showToast("error", "Upload failed", err.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-[32rem] gap-4 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
      <section className="flex max-h-[calc(100dvh-11rem)] min-h-[28rem] flex-col rounded-2xl border border-border/60 bg-card">
        <div className="flex items-center justify-between gap-2 border-b border-border/40 px-3 py-3">
          <h2 className="text-sm font-semibold">Documents</h2>
          <Button
            size="sm"
            onClick={() => {
              setCreating(true);
              setDraft(emptyDraft());
            }}
          >
            <Plus className="h-4 w-4" />
            Add document
          </Button>
        </div>
        <div className="px-3 py-2">
          <Input
            className="h-9"
            placeholder="Search code or name"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center gap-2 px-4 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading
            </div>
          ) : visible.length === 0 ? (
            <p className="px-4 py-8 text-sm text-muted-foreground">No documents match.</p>
          ) : (
            visible.map((row) => {
              const active = !creating && row.id === selectedId;
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => {
                    setCreating(false);
                    setSelectedId(row.id);
                  }}
                  className={`flex w-full items-start justify-between gap-3 border-b border-border/30 px-3 py-3 text-left ${
                    active ? "bg-secondary" : "hover:bg-secondary/50"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block font-mono text-[11px] text-muted-foreground">{row.docCode}</span>
                    <span className="block text-sm font-medium leading-snug">{row.name}</span>
                  </span>
                  <Badge variant="outline" className="shrink-0">
                    {row.expiryTracked ? "Tracked" : "No"}
                  </Badge>
                </button>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {creating ? "New document" : "Selected document"}
          </p>
          <Button asChild variant="ghost" size="sm">
            <Link to={ROUTES.ADMIN.APPROVALS_DASHBOARD}>
              Approvals & Permits
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {creating ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Code" value={draft.docCode} onChange={(value) => setDraft({ ...draft, docCode: value })} />
              <Field label="Name" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} />
              <Field label="Category" value={draft.category} onChange={(value) => setDraft({ ...draft, category: value })} />
              <Field label="Owner" value={draft.sourceOwner} onChange={(value) => setDraft({ ...draft, sourceOwner: value })} />
            </div>
            <Area label="Required for" value={draft.typicallyRequiredFor} onChange={(value) => setDraft({ ...draft, typicallyRequiredFor: value })} />
            <Toggle label="Track expiry" checked={draft.expiryTracked} onChange={(value) => setDraft({ ...draft, expiryTracked: value })} />
            <div className="flex gap-2">
              <Button disabled={busy || !draft.docCode || !draft.name} onClick={createRow}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save document"}
              </Button>
              <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
            </div>
          </div>
        ) : !selected || !details ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Select a document.</p>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
            <div className="space-y-3">
              {companyHeld ? (
                <>
                  <FilePreview path={details.filePath} />
                  <input
                    ref={fileRef}
                    type="file"
                    accept={ACCEPT}
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) uploadFile(file);
                    }}
                  />
                  <Button className="w-full" variant="outline" disabled={busy} onClick={() => fileRef.current?.click()}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {details.filePath ? "Replace file" : "Upload file"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {details.status === "EXPIRED" ? "This copy has expired." : details.filePath ? "Projects use this file. They do not upload it again." : "Upload once. Every permit that needs this document will pick it up."}
                  </p>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-border/70 bg-secondary/30 px-4 py-6 text-sm text-muted-foreground">
                  This file is attached on the project permit. The company register does not hold a master copy.
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">{details.name || "Document"}</h2>
                <p className="font-mono text-xs text-muted-foreground">{details.docCode}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Category" value={details.category} onChange={(value) => setDetails({ ...details, category: value })} />
                <Field label="Owner" value={details.sourceOwner} onChange={(value) => setDetails({ ...details, sourceOwner: value })} />
                {companyHeld && (
                  <>
                    <Field label="Reference" value={details.referenceNo} onChange={(value) => setDetails({ ...details, referenceNo: value })} />
                    <Field label="Issue date" type="date" value={details.issueDate || ""} onChange={(value) => setDetails({ ...details, issueDate: value })} />
                    <Field label="Expiry" type="date" value={details.expiryDate || ""} onChange={(value) => setDetails({ ...details, expiryDate: value })} />
                  </>
                )}
              </div>
              <Area label="Required for" value={details.typicallyRequiredFor} onChange={(value) => setDetails({ ...details, typicallyRequiredFor: value })} />
              <div className="flex flex-wrap gap-4">
                <Toggle label="Track expiry" checked={!!details.expiryTracked} onChange={(value) => setDetails({ ...details, expiryTracked: value })} />
                <Toggle label="Active" checked={!!details.active} onChange={(value) => setDetails({ ...details, active: value })} />
              </div>
              <div className="flex gap-2">
                <Button disabled={busy} onClick={saveCatalogue}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save details"}
                </Button>
                <Button variant="ghost" className="text-red-700" onClick={() => onDelete(selected)}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={value || ""} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function Area({ label, value, onChange }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Textarea rows={3} value={value || ""} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
      <Label>{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
