import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  archiveProject,
  commerciallyCloseProject,
  fetchCloseoutChecklist,
  updateProjectDlp,
} from "../../api/closeout.api";
import { createSnag, fetchProjectSnags, updateSnagStatus } from "../../api/snags.api";
import CommercialLifecycleBadge from "../../components/projects/CommercialLifecycleBadge";
import {
  COMMERCIAL_LIFECYCLE,
  COMMERCIAL_LIFECYCLE_LABELS,
} from "../../constants/project.constants";
import { useAuth } from "@/shared/context/auth-context";
import { ROLES } from "@/shared/constants/roles";

function canManageCommercial(role) {
  return (
    role === ROLES.BUSINESS_OWNER ||
    role === ROLES.FINANCE ||
    role === ROLES.ADMIN ||
    role === ROLES.SUPER_ADMIN
  );
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString("en-GB");
}

function toIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Match Java Period.between(...).toTotalMonths() used on the backend. */
function monthsBetweenIso(startIso, endIso) {
  const startParts = startIso.split("-").map(Number);
  const endParts = endIso.split("-").map(Number);
  if (startParts.length !== 3 || endParts.length !== 3) return "";
  const [ys, ms, ds] = startParts;
  const [ye, me, de] = endParts;
  if (![ys, ms, ds, ye, me, de].every((n) => Number.isFinite(n))) return "";
  let months = (ye - ys) * 12 + (me - ms);
  if (de < ds) months -= 1;
  return months >= 0 ? String(months) : "";
}

function addMonthsIso(startIso, months) {
  const parts = startIso.split("-").map(Number);
  if (parts.length !== 3 || !Number.isFinite(months)) return "";
  const [y, m, d] = parts;
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return "";
  date.setMonth(date.getMonth() + months);
  return toIsoDate(date);
}

/**
 * Post-completion / DLP panel: commercial close, DLP dates, archive, warranty snags.
 */
export default function PostCompletionPanel({ onLifecycleChange } = {}) {
  const { projectId } = useParams();
  const { role } = useAuth();
  const commercialAuth = canManageCommercial(role);

  const [checklist, setChecklist] = useState(null);
  const [snags, setSnags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const [dlpStart, setDlpStart] = useState("");
  const [dlpEnd, setDlpEnd] = useState("");
  const [dlpMonths, setDlpMonths] = useState("");

  const [warrantyTitle, setWarrantyTitle] = useState("");
  const [warrantyDesc, setWarrantyDesc] = useState("");

  const onDlpStartChange = (value) => {
    setDlpStart(value);
    if (value && dlpEnd) {
      setDlpMonths(monthsBetweenIso(value, dlpEnd));
    } else if (value && dlpMonths !== "" && Number.isFinite(Number(dlpMonths))) {
      setDlpEnd(addMonthsIso(value, Number(dlpMonths)));
    }
  };

  const onDlpEndChange = (value) => {
    setDlpEnd(value);
    if (dlpStart && value) {
      setDlpMonths(monthsBetweenIso(dlpStart, value));
    }
  };

  const onDlpMonthsChange = (value) => {
    setDlpMonths(value);
    if (dlpStart && value !== "" && Number.isFinite(Number(value))) {
      setDlpEnd(addMonthsIso(dlpStart, Number(value)));
    }
  };

  const load = useCallback(() => {
    setLoading(true);
    setMessage("");
    Promise.all([
      fetchCloseoutChecklist(projectId),
      fetchProjectSnags(projectId).catch(() => []),
    ])
      .then(([cl, snagList]) => {
        setChecklist(cl);
        setSnags(Array.isArray(snagList) ? snagList : []);
        setDlpStart(cl?.dlpStartDate || "");
        setDlpEnd(cl?.dlpEndDate || "");
        setDlpMonths(cl?.dlpDurationMonths != null ? String(cl.dlpDurationMonths) : "");
        onLifecycleChange?.(cl);
      })
      .catch((e) => {
        setChecklist(null);
        setMessage(e?.response?.data?.message || e?.message || "Failed to load post-completion");
      })
      .finally(() => setLoading(false));
  }, [projectId, onLifecycleChange]);

  useEffect(() => {
    load();
  }, [load]);

  const stage = checklist?.commercialStage || COMMERCIAL_LIFECYCLE.NOT_READY;
  const closed =
    stage === COMMERCIAL_LIFECYCLE.DEFECTS_LIABILITY ||
    stage === COMMERCIAL_LIFECYCLE.ARCHIVE_ELIGIBLE ||
    stage === COMMERCIAL_LIFECYCLE.ARCHIVED;
  const archived = stage === COMMERCIAL_LIFECYCLE.ARCHIVED;
  const archiveEligible = Boolean(checklist?.archiveEligible);

  const snagsItem = checklist?.items?.find((i) => i.key === "SNAGS");
  const carriedUuids = useMemo(() => {
    const set = new Set();
    (snagsItem?.entries || []).forEach((e) => {
      if (e.carriedForward && e.uuid) set.add(e.uuid);
    });
    return set;
  }, [snagsItem]);

  const postCompletionSnags = useMemo(
    () =>
      snags.filter(
        (s) => s.category === "WARRANTY" || carriedUuids.has(s.uuid)
      ),
    [snags, carriedUuids]
  );

  const onClose = async () => {
    if (!dlpStart) {
      setMessage("DLP Start Date is required");
      return;
    }
    if (!dlpEnd && !dlpMonths) {
      setMessage("Provide DLP End Date or Duration (months)");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const body = {
        dlpStartDate: dlpStart,
        dlpEndDate: dlpEnd || null,
        dlpDurationMonths: dlpMonths ? Number(dlpMonths) : null,
      };
      const cl = await commerciallyCloseProject(projectId, body);
      setChecklist(cl);
      onLifecycleChange?.(cl);
      setMessage("Project commercially closed — now in defects liability.");
    } catch (e) {
      setMessage(e?.response?.data?.message || e?.message || "Commercial close failed");
    } finally {
      setBusy(false);
    }
  };

  const onSaveDlp = async () => {
    setBusy(true);
    setMessage("");
    try {
      const cl = await updateProjectDlp(projectId, {
        dlpStartDate: dlpStart || null,
        dlpEndDate: dlpEnd || null,
        dlpDurationMonths: dlpMonths ? Number(dlpMonths) : null,
      });
      setChecklist(cl);
      onLifecycleChange?.(cl);
      setMessage("DLP dates updated.");
    } catch (e) {
      setMessage(e?.response?.data?.message || e?.message || "Failed to update DLP");
    } finally {
      setBusy(false);
    }
  };

  const onArchive = async () => {
    setBusy(true);
    setMessage("");
    try {
      const cl = await archiveProject(projectId);
      setChecklist(cl);
      onLifecycleChange?.(cl);
      setMessage("Project archived — read-only.");
    } catch (e) {
      setMessage(e?.response?.data?.message || e?.message || "Archive failed");
    } finally {
      setBusy(false);
    }
  };

  const onCreateWarranty = async () => {
    if (!warrantyTitle.trim()) {
      setMessage("Warranty snag title is required");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await createSnag(projectId, {
        title: warrantyTitle.trim(),
        description: warrantyDesc.trim() || undefined,
        category: "WARRANTY",
        clientVisible: true,
      });
      setWarrantyTitle("");
      setWarrantyDesc("");
      await load();
      setMessage("Warranty snag created.");
    } catch (e) {
      setMessage(e?.response?.data?.message || e?.message || "Failed to create warranty snag");
    } finally {
      setBusy(false);
    }
  };

  const onCloseSnag = async (uuid) => {
    setBusy(true);
    try {
      await updateSnagStatus(projectId, uuid, "CLOSED");
      await load();
    } catch (e) {
      setMessage(e?.response?.data?.message || e?.message || "Failed to update snag");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            Commercial lifecycle
            <CommercialLifecycleBadge stage={stage} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            {COMMERCIAL_LIFECYCLE_LABELS[stage] || stage}. Operational project status is separate and
            unchanged by commercial close.
          </p>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

          {!closed && (
            <div className="space-y-3 rounded-lg border border-border/60 p-4">
              <p className="font-medium">Commercially close project</p>
              <p className="text-xs text-muted-foreground">
                Requires a fully satisfied close-out checklist and Final Account review. Enter the
                contractual defects liability start date.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="dlp-start">DLP Start Date</Label>
                  <Input
                    id="dlp-start"
                    type="date"
                    value={dlpStart}
                    onChange={(e) => onDlpStartChange(e.target.value)}
                    disabled={!commercialAuth || !checklist?.allSatisfied || busy}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dlp-end">DLP End Date</Label>
                  <Input
                    id="dlp-end"
                    type="date"
                    value={dlpEnd}
                    onChange={(e) => onDlpEndChange(e.target.value)}
                    disabled={!commercialAuth || !checklist?.allSatisfied || busy}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dlp-months">Duration (months)</Label>
                  <Input
                    id="dlp-months"
                    type="number"
                    min={0}
                    value={dlpMonths}
                    onChange={(e) => onDlpMonthsChange(e.target.value)}
                    disabled={!commercialAuth || !checklist?.allSatisfied || busy}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the contractual defects liability start date. Provide end date and/or duration.
              </p>
              {commercialAuth ? (
                <Button
                  size="sm"
                  disabled={!checklist?.allSatisfied || busy}
                  onClick={onClose}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Commercially close project
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Only Business Owner, Finance, or Admin can commercially close a project.
                </p>
              )}
              {!checklist?.allSatisfied ? (
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Close-out checklist is not fully satisfied yet.
                </p>
              ) : null}
            </div>
          )}

          {closed && !archived && (
            <div className="space-y-3 rounded-lg border border-border/60 p-4">
              <p className="font-medium">Defects Liability Period</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="dlp-start-edit">DLP Start Date</Label>
                  <Input
                    id="dlp-start-edit"
                    type="date"
                    value={dlpStart}
                    onChange={(e) => onDlpStartChange(e.target.value)}
                    disabled={!commercialAuth || busy}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dlp-end-edit">DLP End Date</Label>
                  <Input
                    id="dlp-end-edit"
                    type="date"
                    value={dlpEnd}
                    onChange={(e) => onDlpEndChange(e.target.value)}
                    disabled={!commercialAuth || busy}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dlp-months-edit">Duration (months)</Label>
                  <Input
                    id="dlp-months-edit"
                    type="number"
                    min={0}
                    value={dlpMonths}
                    onChange={(e) => onDlpMonthsChange(e.target.value)}
                    disabled={!commercialAuth || busy}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Closed {formatDate(checklist?.commerciallyClosedAt)}. Enter the contractual defects
                liability start date.
              </p>
              {commercialAuth ? (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" disabled={busy} onClick={onSaveDlp}>
                    Save DLP dates
                  </Button>
                  <Button
                    size="sm"
                    disabled={!archiveEligible || busy}
                    onClick={onArchive}
                  >
                    Archive project
                  </Button>
                </div>
              ) : null}
              {!archiveEligible ? (
                <p className="text-xs text-muted-foreground">
                  Archive becomes available after the DLP end date ({formatDate(checklist?.dlpEndDate)}).
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  DLP end date has passed — archive is available for Business Owner, Finance, or Admin.
                </p>
              )}
            </div>
          )}

          {archived && (
            <p className="text-sm text-muted-foreground">
              Archived {formatDate(checklist?.archivedAt)}. This project is read-only.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Warranty / post-completion snags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!archived && closed ? (
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Input
                placeholder="Title"
                value={warrantyTitle}
                onChange={(e) => setWarrantyTitle(e.target.value)}
                disabled={busy}
              />
              <Input
                placeholder="Description (optional)"
                value={warrantyDesc}
                onChange={(e) => setWarrantyDesc(e.target.value)}
                disabled={busy}
              />
              <Button size="sm" disabled={busy} onClick={onCreateWarranty}>
                Add warranty snag
              </Button>
            </div>
          ) : null}
          {postCompletionSnags.length === 0 ? (
            <p className="text-sm text-muted-foreground">No warranty or carried-forward snags yet.</p>
          ) : (
            <ul className="divide-y divide-border/50">
              {postCompletionSnags.map((s) => (
                <li key={s.uuid} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                  <div>
                    <p className="font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.category === "WARRANTY" ? "Warranty" : "Carried forward"} · {s.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{s.status}</Badge>
                    {!archived && s.status !== "CLOSED" ? (
                      <Button size="sm" variant="ghost" disabled={busy} onClick={() => onCloseSnag(s.uuid)}>
                        Close
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
