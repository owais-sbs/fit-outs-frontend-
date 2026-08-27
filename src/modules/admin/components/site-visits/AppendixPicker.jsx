import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { fetchAppendixMasters } from "../../api/appendix.api";

export default function AppendixPicker({
  selectedIds = [],
  onChange,
  disabled = false,
  label = "Include appendix pages",
}) {
  const [masters, setMasters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppendixMasters()
      .then(setMasters)
      .catch(() => setMasters([]))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (uuid) => {
    if (disabled) return;
    const set = new Set(selectedIds || []);
    if (set.has(uuid)) set.delete(uuid);
    else set.add(uuid);
    const ids = [...set];
    const selected = masters.filter((m) => ids.includes(m.uuid));
    onChange?.(ids, selected);
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading appendices…</p>;
  }

  if (masters.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No appendix masters configured. Add them under Project configuration → Appendices.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="grid gap-2 sm:grid-cols-2">
        {masters.map((m) => {
          const checked = (selectedIds || []).includes(m.uuid);
          return (
            <label
              key={m.uuid}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                checked ? "border-primary/50 bg-primary/5" : "border-border/60"
              } ${disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-muted/30"}`}
            >
              <Checkbox
                checked={checked}
                disabled={disabled}
                onCheckedChange={() => toggle(m.uuid)}
                className="mt-0.5"
              />
              {m.imageUrl ? (
                <img src={m.imageUrl} alt="" className="h-14 w-20 rounded object-cover border" />
              ) : (
                <div className="h-14 w-20 rounded bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{m.title}</p>
                {m.category && (
                  <p className="text-xs text-muted-foreground">{m.category}</p>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
