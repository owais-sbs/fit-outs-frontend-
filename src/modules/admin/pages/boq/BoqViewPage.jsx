import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Download, FileText, PenTool, XCircle } from "lucide-react";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/shared/context/auth-context";
import { ROUTES, boqInboxPath } from "@/shared/constants/routes";
import { ROLES, canApproveBoq, isBoqPendingForRole } from "@/shared/constants/roles";
import { isBoqEditable } from "./boqDataUtils";
import { formatCurrency } from "./quantityCalcUtils";
import { apiBoqToDocument } from "./boqApiUtils";
import BoqInvoiceTemplate from "./BoqInvoiceTemplate";
import BoqApprovalTimeline, { BoqStatusBadge } from "./BoqApprovalTimeline";
import { downloadBoqPdf, printBoqDocument } from "./boqPdfExport";
import {
  approveBoq,
  fetchBoq,
  fetchBoqApprovalHistory,
  rejectBoq,
} from "../../api/boq.api";

const QAS_EDIT_ROLES = new Set([ROLES.QS, ROLES.SENIOR_QS, ROLES.ADMIN, ROLES.SUPER_ADMIN]);

function projectBackPath(role, projectId) {
  if (!projectId) return null;
  if (role === ROLES.PROJECT_MANAGER) {
    return ROUTES.PROJECT_MANAGER.PROJECT_DETAIL.replace(":projectId", projectId);
  }
  if (role === ROLES.CLIENT) {
    return ROUTES.CLIENT.PROJECT_DETAIL.replace(":projectId", projectId);
  }
  if (role === ROLES.BUSINESS_OWNER) {
    return ROUTES.BUSINESS_OWNER.COMMERCIAL;
  }
  return ROUTES.ADMIN.PROJECT_DETAIL.replace(":projectId", projectId);
}

export default function BoqViewPage() {
  const { boqId } = useParams();
  const [searchParams] = useSearchParams();
  const { role } = useAuth();
  const projectIdParam = searchParams.get("projectId");

  const [apiBoq, setApiBoq] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [comments, setComments] = useState("");
  const [acting, setActing] = useState(false);

  const load = useCallback(() => {
    if (!boqId) return;
    setLoading(true);
    setError("");
    Promise.all([fetchBoq(boqId), fetchBoqApprovalHistory(boqId).catch(() => null)])
      .then(([boq, hist]) => {
        setApiBoq(boq);
        setHistory(hist);
      })
      .catch((e) => {
        setApiBoq(null);
        setError(e.response?.data?.message || e.response?.data?.error || "Unable to load BOQ.");
      })
      .finally(() => setLoading(false));
  }, [boqId]);

  useEffect(() => {
    load();
  }, [load]);

  const projectId = projectIdParam || apiBoq?.projectId;
  const doc = apiBoq
    ? apiBoqToDocument(apiBoq, {
        ref: apiBoq.id,
        project: {
          id: apiBoq.projectId,
          name: apiBoq.projectName,
          projectName: apiBoq.projectName,
        },
      })
    : null;

  const backToInbox = boqInboxPath(role);
  const backToProject = projectBackPath(role, projectId);
  const canAct = canApproveBoq(role) && isBoqPendingForRole(role, apiBoq?.status);
  const showEditInQas = QAS_EDIT_ROLES.has(role) && isBoqEditable(apiBoq?.status) && projectId;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadBoqPdf("boq-invoice-print", `BOQ-v${apiBoq?.version || "1"}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  const confirmAction = async () => {
    if (!apiBoq) return;
    if (actionType === "reject" && !comments.trim()) {
      setMessage("Please provide a reason for rejection.");
      return;
    }
    setActing(true);
    setMessage("");
    try {
      if (actionType === "approve") {
        await approveBoq(apiBoq.id, comments.trim() || null);
        setMessage("BOQ approved.");
      } else {
        await rejectBoq(apiBoq.id, comments.trim());
        setMessage("BOQ returned to the QS team.");
      }
      setActionType(null);
      setComments("");
      load();
    } catch (e) {
      setMessage(e.response?.data?.message || "Action failed.");
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <p className="py-16 text-center text-sm text-muted-foreground">Loading BOQ…</p>
      </PageShell>
    );
  }

  if (error || !doc) {
    return (
      <PageShell>
        <PageTitle title="BOQ" subtitle="Read-only quotation document." />
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error || "BOQ not found."}</p>
        <Button variant="outline" size="sm" asChild>
          <Link to={backToInbox}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Link>
        </Button>
      </PageShell>
    );
  }

  return (
    <PageShell className="max-w-5xl mx-auto">
      <PageTitle
        title={`BOQ v${doc.version || "1.0"}`}
        subtitle={doc.project?.projectName || doc.project?.name || "Quotation"}
        actions={
          <div className="flex flex-wrap gap-2">
            {backToProject && (
              <Button variant="outline" size="sm" asChild>
                <Link to={backToProject}>Project</Link>
              </Button>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link to={backToInbox}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Inbox
              </Link>
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <BoqStatusBadge status={doc.status} />
          <span className="text-sm font-semibold tabular-nums">{formatCurrency(doc.totals?.grandTotal)}</span>
          <span className="text-xs text-muted-foreground">{doc.lines?.length || 0} lines</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {showEditInQas && (
            <Button variant="outline" size="sm" asChild>
              <Link to={`${ROUTES.ADMIN.QAS}?projectId=${projectId}`}>
                <PenTool className="mr-1 h-4 w-4" /> Edit in QAS
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => printBoqDocument("boq-invoice-print")}>
            <FileText className="mr-1 h-4 w-4" /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading}>
            <Download className="mr-1 h-4 w-4" /> {downloading ? "Generating…" : "PDF"}
          </Button>
          {canAct && (
            <>
              <Button size="sm" variant="outline" onClick={() => { setActionType("approve"); setComments(""); }}>
                <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
              </Button>
              <Button size="sm" variant="outline" className="text-destructive" onClick={() => { setActionType("reject"); setComments(""); }}>
                <XCircle className="mr-1 h-4 w-4" /> Reject
              </Button>
            </>
          )}
        </div>
      </div>

      {message && (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-200">
          {message}
        </p>
      )}

      {doc.lastRejectionComment && (
        <p className="text-sm text-destructive">Last rejection: {doc.lastRejectionComment}</p>
      )}

      <BoqInvoiceTemplate boq={doc} floors={[]} rooms={[]} />

      <div className="rounded-lg border p-4 print:hidden">
        <h3 className="text-sm font-semibold mb-3">Approval workflow</h3>
        <BoqApprovalTimeline history={history} />
      </div>

      <Dialog open={!!actionType} onOpenChange={(open) => !open && setActionType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve BOQ" : "Reject BOQ"}
              {doc.version ? ` · v${doc.version}` : ""}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {doc.project?.projectName} · {formatCurrency(doc.totals?.grandTotal)}
          </p>
          <div className="space-y-2">
            <Label htmlFor="boq-view-comments">
              Comments {actionType === "reject" ? "(required)" : "(optional)"}
            </Label>
            <Input
              id="boq-view-comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={actionType === "reject" ? "Reason for rejection…" : "Optional note…"}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)}>Cancel</Button>
            <Button
              onClick={confirmAction}
              disabled={acting}
              variant={actionType === "reject" ? "destructive" : "default"}
            >
              {acting ? "Processing…" : actionType === "approve" ? "Confirm Approve" : "Confirm Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
