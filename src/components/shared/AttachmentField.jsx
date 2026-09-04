import { Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  attachmentHref,
  attachmentLabel,
  isImagePath,
  isPdfPath,
  parseAttachmentPaths,
} from "@/lib/attachments";
import { PdfAttachmentPreview } from "@/components/shared/PdfAttachmentPreview";

export function AttachmentList({ paths, className = "", inlinePreview = true }) {
  const items = parseAttachmentPaths(paths);
  if (items.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {items.map((path) => {
        const href = attachmentHref(path);
        const label = attachmentLabel(path);
        if (isImagePath(path)) {
          return (
            <a
              key={path}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-16 w-16 overflow-hidden rounded-lg border bg-muted/30"
            >
              <img src={href} alt={label} className="h-full w-full object-cover" />
            </a>
          );
        }
        if (inlinePreview && isPdfPath(path)) {
          return <PdfAttachmentPreview key={path} path={path} />;
        }
        return (
          <a
            key={path}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border bg-muted/30 px-2.5 py-1.5 text-xs hover:bg-muted/50"
          >
            <Paperclip className="h-3.5 w-3.5 shrink-0" />
            <span className="max-w-[140px] truncate">{label}</span>
          </a>
        );
      })}
    </div>
  );
}

export function AttachmentUploadField({
  label = "Photos / documents",
  hint = "Images or PDFs to support this progress log",
  files = [],
  onFilesChange,
  disabled = false,
  multiple = true,
  accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx",
}) {
  const removeFile = (index) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium">{label}</label>
      <input
        type="file"
        multiple={multiple}
        accept={accept}
        disabled={disabled}
        className="block w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground"
        onChange={(e) => {
          const picked = Array.from(e.target.files || []);
          if (picked.length) onFilesChange([...files, ...picked]);
          e.target.value = "";
        }}
      />
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between gap-2 rounded-md border bg-muted/20 px-2.5 py-1.5 text-xs"
            >
              <span className="truncate">{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                disabled={disabled}
                onClick={() => removeFile(index)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
