import { Download, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resolveFileUrl } from "@/modules/admin/api/documents.api";

export default function VariationAttachments({ attachments = [], editable, busy, onUpload }) {
  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold"><Paperclip className="h-4 w-4" /> Attachments</h3>
      {attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No attachments uploaded.</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {attachments.map((attachment) => {
            const href = attachment.downloadUrl
              ? resolveFileUrl(attachment.downloadUrl)
              : resolveFileUrl(attachment.filePath);
            return (
              <li key={attachment.uuid} className="flex items-center justify-between gap-3 p-3 text-sm">
                <div>
                  <div className="font-medium">{attachment.originalName || "Attachment"}</div>
                  <div className="text-xs text-muted-foreground">{attachment.createdAt ? new Date(attachment.createdAt).toLocaleString() : ""}</div>
                </div>
                {href && <Button size="sm" variant="outline" asChild><a href={href} target="_blank" rel="noreferrer" download><Download className="mr-1 h-3 w-3" /> Download</a></Button>}
              </li>
            );
          })}
        </ul>
      )}
      {editable && <Input aria-label="Upload variation attachment" type="file" disabled={busy} onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onUpload(file);
        e.target.value = "";
      }} />}
    </div>
  );
}
