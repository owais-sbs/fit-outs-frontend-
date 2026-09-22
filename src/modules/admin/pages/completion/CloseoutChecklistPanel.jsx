import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  Loader2,
  AlertTriangle,
  GitBranch,
  Receipt,
  BookOpenCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  CLOSEOUT_ITEM_KEYS,
  confirmCloseoutAccounting,
  confirmCloseoutFinalInvoice,
  fetchCloseoutChecklist,
  saveCloseoutCarriedSnags,
} from "../../api/closeout.api";
import { portalRoutesFromPath, PROJECT_DETAIL_NAV_STATE } from "@/shared/constants/routes";
import { isCommercialFrozen } from "../../constants/project.constants";

function itemIcon(key) {
  switch (key) {
    case CLOSEOUT_ITEM_KEYS.VARIATIONS:
      return GitBranch;
    case CLOSEOUT_ITEM_KEYS.SNAGS:
      return AlertTriangle;
    case CLOSEOUT_ITEM_KEYS.FINAL_INVOICE:
      return Receipt;
    case CLOSEOUT_ITEM_KEYS.ACCOUNTING:
      return BookOpenCheck;
    default:
      return Circle;
  }
}

function formatWhen(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString();
}

function projectSubPath(routes, key, projectId) {
  const template = routes?.[key];
  return template ? template.replace(":projectId", projectId) : null;
}

/**
 * Close-out checklist panel (Module 27 Part 1). Used inside Project Completion tabs.
 */
export default function CloseoutChecklistPanel({ onChecklistChange } = {}) {
  const { projectId } = useParams();
  const location = useLocation();
  const routes = portalRoutesFromPath(location.pathname);
  const snagsPath = projectSubPath(routes, "PROJECT_SNAGS", projectId);
  const variationsPath = projectSubPath(routes, "PROJECT_VARIATIONS", projectId);
  const billingPath = projectSubPath(routes, "PROJECT_BILLING", projectId);

  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [carriedDraft, setCarriedDraft] = useState([]);

  const applyChecklist = useCallback(
    (data) => {
      setChecklist(data);
      onChecklistChange?.(data);
      const snagsItem = (data?.items || []).find((item) => item.key === CLOSEOUT_ITEM_KEYS.SNAGS);
      setCarriedDraft(
        (snagsItem?.entries || [])
          .filter((entry) => entry.carriedForward)
          .map((entry) => entry.uuid)
      );
    },
    [onChecklistChange]
  );

  const load = useCallback(() => {
    setLoading(true);
    fetchCloseoutChecklist(projectId)
      .then(applyChecklist)
      .catch((e) => {
        setChecklist(null);
        onChecklistChange?.(null);
        setMessage(e?.response?.data?.message || e?.message || "Failed to load close-out checklist");
      })
      .finally(() => setLoading(false));
  }, [projectId, applyChecklist, onChecklistChange]);

  useEffect(() => {
    load();
  }, [load]);

  const snagsItem = useMemo(
    () => (checklist?.items || []).find((item) => item.key === CLOSEOUT_ITEM_KEYS.SNAGS),
    [checklist]
  );

  const carriedDirty = useMemo(() => {
    const saved = (snagsItem?.entries || [])
      .filter((entry) => entry.carriedForward)
      .map((entry) => entry.uuid)
      .sort();
    const draft = [...carriedDraft].sort();
    return JSON.stringify(saved) !== JSON.stringify(draft);
  }, [snagsItem, carriedDraft]);

  const run = async (fn, okMsg) => {
    setBusy(true);
    setMessage("");
    try {
      const data = await fn();
      applyChecklist(data);
      if (okMsg) setMessage(okMsg);
    } catch (e) {
      setMessage(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Request failed");
    } finally {
      setBusy(false);
    }
  };

  const toggleCarried = (uuid, checked) => {
    setCarriedDraft((current) => {
      if (checked) return current.includes(uuid) ? current : [...current, uuid];
      return current.filter((id) => id !== uuid);
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const commercialFrozen = isCommercialFrozen(checklist?.commercialStage);

  return (
    <div className="space-y-3">
      {message && (
        <p className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">{message}</p>
      )}

      {checklist && (
        <Card>
          <CardContent className="p-5 md:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold">{checklist.summary}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {checklist.satisfiedCount} of {checklist.outstandingCount + checklist.satisfiedCount} close-out
                  requirements satisfied.
                </p>
              </div>
              <Badge variant={checklist.allSatisfied ? "success" : "warning"}>
                {checklist.allSatisfied ? "Ready to close" : `${checklist.outstandingCount} outstanding`}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {(checklist?.items || []).map((item, index) => {
        const Icon = itemIcon(item.key);
        const openEntries = (item.entries || []).filter((entry) => !entry.carriedForward);
        const sourcePath =
          item.key === CLOSEOUT_ITEM_KEYS.VARIATIONS
            ? variationsPath
            : item.key === CLOSEOUT_ITEM_KEYS.SNAGS
              ? snagsPath
              : item.key === CLOSEOUT_ITEM_KEYS.FINAL_INVOICE
                ? billingPath
                : null;

        return (
          <Card key={item.key}>
            <CardContent className="p-5 md:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    item.satisfied
                      ? "bg-emerald-500/15 text-emerald-700"
                      : "bg-amber-500/15 text-amber-700"
                  )}
                >
                  {item.satisfied ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold">{item.title}</h2>
                    <Badge variant={item.satisfied ? "success" : "warning"}>
                      {item.satisfied ? "Satisfied" : "Outstanding"}
                    </Badge>
                    <Badge variant="outline">
                      {item.evaluation === "AUTOMATIC" ? "From live records" : "Needs confirmation"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.detail}</p>
                  {item.confirmedAt && (
                    <p className="text-xs text-muted-foreground">
                      Confirmed {formatWhen(item.confirmedAt)}
                    </p>
                  )}
                </div>
              </div>

              {item.key === CLOSEOUT_ITEM_KEYS.SNAGS && (item.entries || []).length > 0 && (
                <div className="space-y-2 rounded-lg border border-border/60 bg-secondary/30 p-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Open snags can be closed in the snag register, or carried forward into the defects period.
                  </p>
                  {(item.entries || []).map((entry) => (
                    <label key={entry.uuid} className="flex items-start gap-2 text-sm">
                      <Checkbox
                        className="mt-0.5"
                        checked={carriedDraft.includes(entry.uuid)}
                        disabled={busy || commercialFrozen}
                        onCheckedChange={(checked) => toggleCarried(entry.uuid, checked === true)}
                      />
                      <span>
                        <span className="font-medium">{entry.title}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{entry.status}</span>
                      </span>
                    </label>
                  ))}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      size="sm"
                      disabled={busy || !carriedDirty || commercialFrozen}
                      onClick={() =>
                        run(
                          () => saveCloseoutCarriedSnags(projectId, carriedDraft),
                          "Carried-forward snags updated"
                        )
                      }
                    >
                      Save carried-forward snags
                    </Button>
                    {snagsPath && (
                      <Button asChild size="sm" variant="outline">
                        <Link to={snagsPath} state={PROJECT_DETAIL_NAV_STATE}>Open snags</Link>
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {item.key === CLOSEOUT_ITEM_KEYS.VARIATIONS && openEntries.length > 0 && (
                <ul className="space-y-1 rounded-lg border border-border/60 bg-secondary/30 p-3 text-sm">
                  {openEntries.map((entry) => (
                    <li key={entry.uuid}>
                      <span className="font-mono text-xs text-muted-foreground">{entry.reference}</span>
                      <span className="mx-2">{entry.title}</span>
                      <span className="text-xs text-muted-foreground">{entry.status}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-wrap gap-2">
                {item.key === CLOSEOUT_ITEM_KEYS.FINAL_INVOICE && (
                  <Button
                    size="sm"
                    variant={item.satisfied ? "outline" : "default"}
                    disabled={busy || commercialFrozen}
                    onClick={() =>
                      run(
                        () => confirmCloseoutFinalInvoice(projectId, !item.satisfied),
                        item.satisfied ? "Final invoice confirmation cleared" : "Final invoice marked as issued"
                      )
                    }
                  >
                    {item.satisfied ? "Clear confirmation" : "Confirm final invoice issued"}
                  </Button>
                )}
                {item.key === CLOSEOUT_ITEM_KEYS.ACCOUNTING && (
                  <Button
                    size="sm"
                    variant={item.satisfied ? "outline" : "default"}
                    disabled={busy || commercialFrozen}
                    onClick={() =>
                      run(
                        () => confirmCloseoutAccounting(projectId, !item.satisfied),
                        item.satisfied ? "Accounting confirmation cleared" : "Accounting marked as synchronized"
                      )
                    }
                  >
                    {item.satisfied ? "Clear confirmation" : "Confirm accounting synchronized"}
                  </Button>
                )}
                {item.key !== CLOSEOUT_ITEM_KEYS.SNAGS && sourcePath && (
                  <Button asChild size="sm" variant="outline">
                    <Link to={sourcePath} state={PROJECT_DETAIL_NAV_STATE}>
                      {item.key === CLOSEOUT_ITEM_KEYS.VARIATIONS ? "Open variations" : "Open billing"}
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
