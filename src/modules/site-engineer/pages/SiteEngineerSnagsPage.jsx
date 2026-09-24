import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchMySnags, updateMySnagStatus } from "@/modules/site-engineer/api/snags.api";

const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "READY_FOR_INSPECTION", "RESOLVED", "CLOSED"];

export default function SiteEngineerSnagsPage() {
  const [snags, setSnags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    fetchMySnags()
      .then((list) => setSnags(Array.isArray(list) ? list : []))
      .catch((e) => setError(e?.response?.data?.message || e.message || "Failed to load snags"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const onStatus = async (snag, status) => {
    setBusyId(snag.uuid);
    try {
      await updateMySnagStatus(snag.projectId, snag.uuid, status);
      load();
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to update status");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PageShell>
      <PageTitle title="Snags" subtitle="Defects and snags assigned to you" />

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && snags.length === 0 && (
        <Surface className="px-4 py-10 text-center text-sm text-muted-foreground">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          No snags assigned to you.
        </Surface>
      )}

      <div className="grid gap-3">
        {snags.map((s) => (
          <Surface key={s.uuid} className="p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold tracking-tight">{s.title || s.description || "Snag"}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Project #{s.projectId}
                  {s.location ? ` · ${s.location}` : ""}
                </p>
              </div>
              <Badge variant="secondary">{s.status || "OPEN"}</Badge>
            </div>
            {s.description && (
              <p className="mb-3 text-sm text-muted-foreground whitespace-pre-wrap">{s.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={s.status || "OPEN"}
                onValueChange={(v) => onStatus(s, v)}
                disabled={busyId === s.uuid}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((st) => (
                    <SelectItem key={st} value={st}>
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {busyId === s.uuid && (
                <Button size="sm" variant="ghost" disabled>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </Button>
              )}
            </div>
          </Surface>
        ))}
      </div>
    </PageShell>
  );
}
