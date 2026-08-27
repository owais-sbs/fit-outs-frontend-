import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildDefaultSubject } from "../../data/jctCoverLetterCopy";
import CoverLetterTemplate from "./CoverLetterTemplate";
import AppendixPicker from "./AppendixPicker";

export default function CoverLetterStep({
  estimate,
  onChange,
  disabled = false,
  previewRef,
}) {
  const updateField = (field, value) => {
    if (disabled) return;
    const next = { ...estimate, [field]: value };
    if (field === "locationLabel" && (!estimate.subject || estimate.subject.includes("TURNKEY"))) {
      next.subject = buildDefaultSubject(value);
    }
    onChange?.(next);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.4fr)]">
      <div className="space-y-3 rounded-lg border border-border/60 bg-muted/10 p-4">
        <h2 className="text-base font-semibold">Cover letter details</h2>
        <div className="space-y-2">
          <Label>Quote No.</Label>
          <Input
            value={estimate?.quoteNo || ""}
            disabled={disabled}
            onChange={(e) => updateField("quoteNo", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label>Valid until</Label>
            <Input
              type="date"
              value={estimate?.validUntil || ""}
              disabled={disabled}
              onChange={(e) => updateField("validUntil", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Revision</Label>
            <Input
              value={estimate?.revision || "R0"}
              disabled={disabled}
              onChange={(e) => updateField("revision", e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Client name</Label>
          <Input
            value={estimate?.clientName || ""}
            disabled={disabled}
            onChange={(e) => updateField("clientName", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Client address</Label>
          <Input
            value={estimate?.clientAddress || ""}
            disabled={disabled}
            onChange={(e) => updateField("clientAddress", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Project</Label>
          <Input
            value={estimate?.projectLabel || ""}
            disabled={disabled}
            onChange={(e) => updateField("projectLabel", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Location</Label>
          <Input
            value={estimate?.locationLabel || ""}
            disabled={disabled}
            onChange={(e) => updateField("locationLabel", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Subject</Label>
          <Input
            value={estimate?.subject || ""}
            disabled={disabled}
            onChange={(e) => updateField("subject", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Prepared by (QS)</Label>
          <Input
            value={estimate?.preparedBy || ""}
            disabled={disabled}
            placeholder="Quantity Surveyor name"
            onChange={(e) => updateField("preparedBy", e.target.value)}
          />
        </div>
        <AppendixPicker
          selectedIds={estimate?.selectedAppendixIds || []}
          disabled={disabled}
          onChange={(ids, appendices) =>
            onChange?.({
              ...estimate,
              selectedAppendixIds: ids,
              selectedAppendices: appendices || [],
            })
          }
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border/60 bg-muted/20 p-4">
        <CoverLetterTemplate
          ref={previewRef}
          estimate={estimate}
          includeAppendix
          selectedAppendices={estimate?.selectedAppendices || []}
        />
      </div>
    </div>
  );
}
