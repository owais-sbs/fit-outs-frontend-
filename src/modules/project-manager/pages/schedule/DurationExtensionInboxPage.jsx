import { useCallback, useEffect, useState } from "react";
import { Check, Clock, Loader2, X } from "lucide-react";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  approveDurationExtension,
  fetchDurationExtensionInbox,
  rejectDurationExtension,
} from "@/modules/admin/api/schedule.api";

function formatDate(value) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleString();
  } catch {
    return null;
  }
}

function reasonLabel(item) {
  const label = item?.delayReasonLabel || item?.delayReasonCode || "—";
  if (item?.delayReasonText && item?.delayReasonCode === "OTHER") {
    return item.delayReasonText;
  }
  if (item?.delayReasonText) {
    return `${label} — ${item.delayReasonText}`;
  }
  return label;
}

export default function DurationExtensionInboxPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    setMessage("");
    fetchDurationExtensionInbox()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((err) => {
        setItems([]);
        setMessage(
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            "Failed to load inbox"
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (uuid, action) => {
    setBusyId(uuid);
    setMessage("");
    try {
      const payload = { decisionNotes: notes[uuid] || null };
      if (action === "approve") {
        await approveDurationExtension(uuid, payload);
        setMessage("Extension approved — programme rescheduled.");
      } else {
        await rejectDurationExtension(uuid, payload);
        setMessage("Extension rejected — dates unchanged.");
      }
      setNotes((n) => {
        const next = { ...n };
        delete next[uuid];
        return next;
      });
      await load();
    } catch (err) {
      setMessage(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Action failed"
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PageShell className="max-w-5xl mx-auto">
      <PageTitle
        title="Duration extensions"
        subtitle="Review site engineer requests to extend activity durations"
      />

      {message && <p className="text-sm text-muted-foreground -mt-2">{message}</p>}

      {loading ? (
        <div className="py-16 flex justify-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : !items.length ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No pending duration extension requests.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const busy = busyId === item.uuid;
            return (
              <Card key={item.uuid}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{item.activityName || "Activity"}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.projectName || `Project ${item.projectId}`}
                        {item.requestedByName ? ` · ${item.requestedByName}` : ""}
                        {formatDate(item.createdAt) ? ` · ${formatDate(item.createdAt)}` : ""}
                      </p>
                    </div>
                    <Badge className="bg-amber-500/15 text-amber-800 gap-1">
                      <Clock className="h-3 w-3" /> Pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span>
                      <span className="text-muted-foreground">Duration: </span>
                      <strong>
                        {item.currentDurationWorkingDays} → {item.requestedDurationWorkingDays} days
                      </strong>
                    </span>
                    <span>
                      <span className="text-muted-foreground">Reason: </span>
                      {reasonLabel(item)}
                    </span>
                  </div>
                  <div>
                    <Label className="text-xs">Decision notes (optional)</Label>
                    <Input
                      value={notes[item.uuid] || ""}
                      onChange={(e) =>
                        setNotes((n) => ({ ...n, [item.uuid]: e.target.value }))
                      }
                      placeholder="Notes for the site engineer…"
                      disabled={busy}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" disabled={busy} onClick={() => decide(item.uuid, "approve")}>
                      <Check className="h-4 w-4 mr-1" />
                      {busy ? "Working…" : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => decide(item.uuid, "reject")}
                    >
                      <X className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
