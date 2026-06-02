import { useState, useRef } from "react";
import {
  Upload, X, FileImage, FileText, Archive, Link2, Plus,
  CheckCircle2, FolderOpen,
} from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const ACCEPT_TYPES = {
  images: { accept: "image/png,image/jpeg,image/jpg", label: "PNG, JPG", icon: FileImage, color: "text-blue-500" },
  pdf: { accept: "application/pdf", label: "PDF", icon: FileText, color: "text-red-500" },
  zip: { accept: "application/zip,.zip,.rar", label: "ZIP, RAR", icon: Archive, color: "text-amber-500" },
};

const INTERIOR_PROJECTS = [
  "Luxury Penthouse Fit-Out — Al Barari Developments",
  "Corporate HQ Office Fit-Out — Meridian Capital Group",
  "Boutique Hotel Lobby Redesign — Crescent Hospitality",
  "High-End Villa Interior — Emirates Elite Properties",
  "Flagship Retail Store — Maison Luxe Fashion",
  "Fine Dining Restaurant — Saffron & Stone Group",
  "Wellness & Spa Center — Serenity Wellness Club",
  "Modern Apartment Complex — Skyline Urban Living",
  "Co-Working Space Fit-Out — HUB Collective Spaces",
  "Private Members Club — The Cornerstone Club",
];

const DESIGN_STAGES = [
  "Concept Design",
  "Schematic Design",
  "Design Development",
  "Technical / Construction Drawings",
  "FF&E Specification",
  "Final Client Presentation",
];

function DropZone({ type, onFiles }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const cfg = ACCEPT_TYPES[type];
  const Icon = cfg.icon;

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    onFiles([...e.dataTransfer.files]);
  };

  const handleInput = (e) => {
    onFiles([...e.target.files]);
    e.target.value = "";
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
        dragging ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/40 hover:bg-muted/20"
      }`}
    >
      <Icon className={`h-7 w-7 ${cfg.color}`} />
      <div>
        <p className="text-sm font-medium">Drop {cfg.label} files here</p>
        <p className="text-xs text-muted-foreground">or click to browse</p>
      </div>
      <input ref={inputRef} type="file" accept={cfg.accept} multiple className="hidden" onChange={handleInput} />
    </div>
  );
}

function FilePreview({ file, onRemove }) {
  const isImage = file.type?.startsWith("image/");
  const previewUrl = isImage ? URL.createObjectURL(file) : null;

  return (
    <div className="group relative flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 p-2.5">
      {isImage && previewUrl ? (
        <img src={previewUrl} alt={file.name} className="h-12 w-16 rounded object-cover shrink-0" />
      ) : (
        <div className="flex h-12 w-16 items-center justify-center rounded bg-muted shrink-0">
          <FolderOpen className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
      </div>
      <button
        onClick={onRemove}
        className="rounded-full p-1 opacity-0 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 transition-all"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

const INITIAL_FORM = { project: "", stage: "", version: "", description: "", figmaLink: "" };

export default function UploadDesignPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [imageFiles, setImageFiles] = useState([]);
  const [pdfFiles, setPdfFiles] = useState([]);
  const [zipFiles, setZipFiles] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const addFiles = (setter) => (newFiles) => setter((prev) => [...prev, ...newFiles]);
  const removeFile = (setter, index) => setter((prev) => prev.filter((_, i) => i !== index));

  const totalFiles = imageFiles.length + pdfFiles.length + zipFiles.length;
  const canSubmit = form.project && form.version && form.stage && totalFiles > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitted(true);
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setImageFiles([]);
    setPdfFiles([]);
    setZipFiles([]);
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Upload Design"
          description="Upload completed interior design concepts and fit-out drawings for client review."
        />
        <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/5 px-8 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold">Upload Successful</h2>
          <p className="mt-2 text-muted-foreground max-w-md">
            <strong>{form.project.split("—")[0].trim()}</strong> ({form.version} · {form.stage}) has been uploaded.
            Status is now <strong className="text-amber-600">Waiting for Client Approval</strong>.
          </p>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <Plus className="h-4 w-4" />
              Upload Another
            </Button>
            <Button>View in Client Approval</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Upload Design"
        description="Upload interior design assets — concept renders, drawings, material schedules, and Figma presentations."
      />

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        {/* Left — form */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Project & Stage Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Project <span className="text-destructive">*</span></label>
                <Select value={form.project} onValueChange={(v) => setForm((f) => ({ ...f, project: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select fit-out project..." /></SelectTrigger>
                  <SelectContent>
                    {INTERIOR_PROJECTS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Design Stage <span className="text-destructive">*</span></label>
                  <Select value={form.stage} onValueChange={(v) => setForm((f) => ({ ...f, stage: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select stage..." /></SelectTrigger>
                    <SelectContent>
                      {DESIGN_STAGES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Version <span className="text-destructive">*</span></label>
                  <Input
                    placeholder="e.g. v1.0, v2.3-Rev"
                    value={form.version}
                    onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Designer Notes</label>
                <textarea
                  rows={3}
                  placeholder="Describe what's included — e.g. 'Updated material palette for master suite, revised FF&E schedule, new lighting plan for lounge'..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  Figma / InVision Presentation Link
                </label>
                <Input
                  placeholder="https://figma.com/proto/..."
                  value={form.figmaLink}
                  onChange={(e) => setForm((f) => ({ ...f, figmaLink: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* File Upload Zones */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Upload Design Files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Images — renders, mood boards */}
              <div className="space-y-2">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <FileImage className="h-4 w-4 text-blue-500" />
                  Renders & Mood Boards (PNG, JPG)
                </p>
                <DropZone type="images" onFiles={addFiles(setImageFiles)} />
                {imageFiles.length > 0 && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {imageFiles.map((f, i) => (
                      <FilePreview key={i} file={f} onRemove={() => removeFile(setImageFiles, i)} />
                    ))}
                  </div>
                )}
              </div>

              {/* PDF — drawings, schedules */}
              <div className="space-y-2">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4 text-red-500" />
                  Drawings & Schedules (PDF)
                </p>
                <DropZone type="pdf" onFiles={addFiles(setPdfFiles)} />
                {pdfFiles.length > 0 && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {pdfFiles.map((f, i) => (
                      <FilePreview key={i} file={f} onRemove={() => removeFile(setPdfFiles, i)} />
                    ))}
                  </div>
                )}
              </div>

              {/* ZIP — CAD files, full packages */}
              <div className="space-y-2">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Archive className="h-4 w-4 text-amber-500" />
                  CAD / Full Design Package (ZIP)
                </p>
                <DropZone type="zip" onFiles={addFiles(setZipFiles)} />
                {zipFiles.length > 0 && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {zipFiles.map((f, i) => (
                      <FilePreview key={i} file={f} onRemove={() => removeFile(setZipFiles, i)} />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right — summary */}
        <div>
          <Card className="border-border/60 shadow-sm sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Upload Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2.5 text-sm">
                {[
                  { label: "Project", value: form.project ? form.project.split("—")[0].trim() : "—" },
                  { label: "Client", value: form.project ? form.project.split("—")[1]?.trim() : "—" },
                  { label: "Stage", value: form.stage || "—" },
                  { label: "Version", value: form.version || "—", mono: true },
                  { label: "Renders", value: imageFiles.length },
                  { label: "PDFs", value: pdfFiles.length },
                  { label: "Archives", value: zipFiles.length },
                  { label: "Figma Link", value: form.figmaLink ? "Attached" : "—" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className={`font-medium max-w-[55%] text-right truncate ${row.mono ? "font-mono" : ""}`}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-dashed border-amber-400/40 bg-amber-500/5 p-3">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  After upload, status will be set to <strong>Waiting for Client Approval</strong> and a record will be auto-created in the Client Approval tracker.
                </p>
              </div>

              <Button type="submit" className="w-full gap-2" disabled={!canSubmit}>
                <Upload className="h-4 w-4" />
                Upload & Submit for Approval
              </Button>
              {!canSubmit && (
                <p className="text-center text-xs text-muted-foreground">
                  Select a project, stage, version, and at least one file.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
