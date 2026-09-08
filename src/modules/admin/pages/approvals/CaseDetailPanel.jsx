import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileArchive,
  Loader2,
  RefreshCw,
  Send,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  assemblePack,
  attachChecklistItem,
  createCaseComment,
  createCaseFee,
  createCaseSubmission,
  fetchApprovalCase,
  patchApprovalCase,
  renewApprovalCase,
  waiveChecklistItem,
} from "../../api/approvals.api";
import { daysLabel, money, statusLabel, statusTone, urgencyTone } from "./approvalStatus";

const CHECKLIST_TONES = {
  ATTACHED: "bg-emerald-500/15 text-emerald-800",
  MISSING: "bg-red-500/15 text-red-800",
  EXPIRED: "bg-red-500/15 text-red-800",
  WAIVED: "bg-copper/15 text-copper-foreground",
  NOT_APPLICABLE: "bg-secondary text-muted-foreground",
};

/**
 * Case detail: checklist, submissions, comments, fees and audit trail.
 * Every action goes through the API, which re-runs the compliance gates, so a blocked
 * transition comes back as a message rather than being prevented only in the UI.
 */
export default function CaseDetailPanel({ caseUuid, onChanged }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [pack, setPack] = useState(null);

  const [submission, setSubmission] = useState({ submittedDate: "", channel: "", authorityReference: "", feeAmount: "" });
  const [fee, setFee] = useState({ type: "FEE", amount: "", paidDate: "", paymentRef: "" });
  const [comment, setComment] = useState({ commentText: "", reasonCode: "" });
  const [issue, setIssue] = useState({ permitNumber: "", issueDate: "", expiryDate: "" });

  const load = useCallback(async () => {
    if (!caseUuid) return;
    setLoading(true);
    try {
      setDetail(await fetchApprovalCase(caseUuid));
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [caseUuid]);

  useEffect(() => {
    setPack(null);
    setMessage("");
    load();
  }, [load]);

  const run = async (fn, successMessage) => {
    setBusy(true);
    setMessage("");
    try {
      const result = await fn();
      if (successMessage) setMessage(successMessage);
      if (result && result.header) setDetail(result);
      else await load();
      onChanged?.();
      return result;
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Action failed");
      return null;
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading case
      </div>
    );
  }
  if (!detail) {
    return <p className="py-10 text-sm text-muted-foreground">Could not load this case.</p>;
  }

  const h = detail.header;
  const transitions = detail.allowedTransitions || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0">
          <div className="font-mono text-xs text-muted-foreground">{h.caseNumber}</div>
          <h3 className="text-lg font-semibold">{h.permitTypeName}</h3>
          <p className="text-sm text-muted-foreground">
            {h.authorityName || h.authorityCode || "Authority not resolved"}
            {h.authorityReference ? ` · ref ${h.authorityReference}` : ""}
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Badge className={statusTone(h.status)}>{statusLabel(h.status)}</Badge>
          {h.slaDueDate && (
            <span className={`text-xs ${urgencyTone(h.daysToSlaDue)}`}>
              SLA {h.slaDueDate} · {daysLabel(h.daysToSlaDue)}
            </span>
          )}
          {h.expiryDate && (
            <span className={`text-xs ${urgencyTone(h.daysToExpiry)}`}>
              Expires {h.expiryDate} · {daysLabel(h.daysToExpiry, "ago")}
            </span>
          )}
        </div>
      </div>

      {h.blockReason && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{h.blockReason}. This case cannot be submitted until it is resolved.</span>
        </div>
      )}

      {message && (
        <div className="rounded-lg bg-secondary px-4 py-3 text-sm text-foreground">{message}</div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() =>
            run(async () => {
              const result = await assemblePack(caseUuid);
              setPack(result);
              await load();
              return null;
            })
          }
        >
          <FileArchive className="h-4 w-4 mr-1" /> Assemble pack
        </Button>

        {transitions.includes("SUBMITTED") || transitions.includes("RESUBMITTED") ? null : null}

        {["ISSUED", "EXPIRED", "EXPIRING_SOON", "RENEWAL_IN_PROGRESS"].includes(h.status) && (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => renewApprovalCase(caseUuid), "Renewal case opened")}>
            <RefreshCw className="h-4 w-4 mr-1" /> Open renewal
          </Button>
        )}

        {transitions
          .filter((t) => !["SUBMITTED", "RESUBMITTED"].includes(t))
          .map((t) => (
            <Button
              key={t}
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => {
                const body = { status: t };
                if (["REJECTED", "WITHDRAWN", "CLOSED"].includes(t)) {
                  const reason = window.prompt(`Reason for marking this case ${statusLabel(t).toLowerCase()}?`);
                  if (!reason) return;
                  body.reason = reason;
                }
                if (t === "ISSUED") {
                  Object.assign(body, {
                    permitNumber: issue.permitNumber || undefined,
                    issueDate: issue.issueDate || undefined,
                    expiryDate: issue.expiryDate || undefined,
                  });
                }
                run(() => patchApprovalCase(caseUuid, body), `Moved to ${statusLabel(t)}`);
              }}
            >
              {statusLabel(t)}
            </Button>
          ))}
      </div>

      {transitions.includes("ISSUED") && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Permit details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-xs">Permit number</Label>
              <Input value={issue.permitNumber} onChange={(e) => setIssue({ ...issue, permitNumber: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Issue date</Label>
              <Input type="date" value={issue.issueDate} onChange={(e) => setIssue({ ...issue, issueDate: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Expiry date</Label>
              <Input type="date" value={issue.expiryDate} onChange={(e) => setIssue({ ...issue, expiryDate: e.target.value })} />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Left blank, this is filled from the permit&rsquo;s seeded validity period.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {pack && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Pack assembly</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className={pack.readyToSubmit ? "text-emerald-700" : "text-amber-800"}>{pack.note}</p>
            <p className="text-xs text-muted-foreground">
              {pack.documentsCollected} documents packaged as{" "}
              <code className="text-[11px]">{pack.packFileName}</code>
            </p>
            {!!pack.autoCollected?.length && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Collected automatically</p>
                <ul className="text-xs text-muted-foreground">
                  {pack.autoCollected.map((a) => <li key={a}>· {a}</li>)}
                </ul>
              </div>
            )}
            {!!pack.missing?.length && (
              <div>
                <p className="text-xs font-semibold text-red-700">Missing</p>
                <ul className="text-xs text-red-700">
                  {pack.missing.map((a) => <li key={a}>· {a}</li>)}
                </ul>
              </div>
            )}
            {!!pack.expired?.length && (
              <div>
                <p className="text-xs font-semibold text-red-700">Expired</p>
                <ul className="text-xs text-red-700">
                  {pack.expired.map((a) => <li key={a}>· {a}</li>)}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Checklist · {detail.checklist.filter((i) => i.blocking).length} blocking
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/40">
            {detail.checklist.map((item) => (
              <div key={item.uuid} className="flex flex-wrap items-center gap-2 px-4 py-2.5">
                <span className="font-mono text-xs text-muted-foreground">{item.documentTypeCode}</span>
                <span className="text-sm">{item.documentTypeName}</span>
                <Badge className={CHECKLIST_TONES[item.status] || CHECKLIST_TONES.MISSING}>
                  {item.status.replace(/_/g, " ").toLowerCase()}
                </Badge>
                {item.source === "AUTO_COLLECTED" && (
                  <span className="text-[11px] text-muted-foreground">collected automatically</span>
                )}
                {item.expiryDate && (
                  <span className={`text-[11px] ${urgencyTone(item.daysToExpiry)}`}>
                    expires {item.expiryDate}
                  </span>
                )}
                {item.waiverReason && (
                  <span className="text-[11px] text-copper-foreground" title={item.waiverReason}>
                    waived
                  </span>
                )}
                <div className="ml-auto flex items-center gap-1">
                  <Input
                    className="h-8 w-56"
                    placeholder="File path"
                    defaultValue={item.filePath || ""}
                    onBlur={(e) => {
                      const value = e.target.value.trim();
                      if (value !== (item.filePath || "")) {
                        run(() => attachChecklistItem(caseUuid, item.uuid, { filePath: value }), "Document attached");
                      }
                    }}
                  />
                  {item.blocking && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      title="Director waiver"
                      onClick={() => {
                        const reason = window.prompt("Director waiver reason?");
                        if (!reason) return;
                        run(() => waiveChecklistItem(caseUuid, item.uuid, { waiverReason: reason }), "Waiver recorded");
                      }}
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {!detail.checklist.length && (
              <p className="px-4 py-6 text-sm text-muted-foreground">No checklist items on this case.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Submissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {detail.submissions.map((s) => (
                <div key={s.uuid} className="rounded-md bg-secondary/60 px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">v{s.version}</span>
                    <span>{s.submittedDate}</span>
                    {s.channel && <span className="text-muted-foreground">via {s.channel}</span>}
                    <Badge className="ml-auto bg-secondary text-muted-foreground">{s.outcome}</Badge>
                  </div>
                  {s.turnaroundDays != null && (
                    <p className="mt-0.5 text-muted-foreground">
                      Turnaround {s.turnaroundDays} working days
                    </p>
                  )}
                </div>
              ))}
              {!detail.submissions.length && (
                <p className="text-xs text-muted-foreground">Nothing submitted yet.</p>
              )}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Submitted date</Label>
                <Input
                  type="date"
                  value={submission.submittedDate}
                  onChange={(e) => setSubmission({ ...submission, submittedDate: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Channel</Label>
                <Input
                  placeholder="Portal, counter, email"
                  value={submission.channel}
                  onChange={(e) => setSubmission({ ...submission, channel: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Authority reference</Label>
                <Input
                  value={submission.authorityReference}
                  onChange={(e) => setSubmission({ ...submission, authorityReference: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Fee paid</Label>
                <Input
                  type="number"
                  value={submission.feeAmount}
                  onChange={(e) => setSubmission({ ...submission, feeAmount: e.target.value })}
                />
              </div>
            </div>
            <Button
              size="sm"
              disabled={busy}
              onClick={() =>
                run(
                  () =>
                    createCaseSubmission(caseUuid, {
                      ...submission,
                      submittedDate: submission.submittedDate || undefined,
                      feeAmount: submission.feeAmount ? Number(submission.feeAmount) : undefined,
                    }),
                  "Submission recorded and the SLA clock started"
                )
              }
            >
              <Send className="h-4 w-4 mr-1" /> Record submission
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Fees and deposits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              {detail.fees.map((f) => (
                <div key={f.uuid} className="flex items-center gap-2 rounded-md bg-secondary/60 px-3 py-2 text-xs">
                  <Badge className="bg-secondary text-muted-foreground">{f.type}</Badge>
                  <span className="font-semibold">{money(f.amount, f.currency)}</span>
                  <span className="text-muted-foreground">{f.paidDate || "unpaid"}</span>
                  {f.refundable && !f.refundReceivedDate && (
                    <span className="ml-auto text-amber-700">
                      outstanding {f.daysOutstanding ?? 0}d
                    </span>
                  )}
                  {f.refundReceivedDate && (
                    <span className="ml-auto text-emerald-700">refunded {f.refundReceivedDate}</span>
                  )}
                </div>
              ))}
              {!detail.fees.length && (
                <p className="text-xs text-muted-foreground">No fees recorded.</p>
              )}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Type</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  value={fee.type}
                  onChange={(e) => setFee({ ...fee, type: e.target.value })}
                >
                  <option value="FEE">Fee</option>
                  <option value="DEPOSIT">Refundable deposit</option>
                  <option value="FINE">Fine</option>
                  <option value="KNOWLEDGE_FEE">Knowledge fee</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Amount</Label>
                <Input type="number" value={fee.amount} onChange={(e) => setFee({ ...fee, amount: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Paid date</Label>
                <Input type="date" value={fee.paidDate} onChange={(e) => setFee({ ...fee, paidDate: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Payment reference</Label>
                <Input value={fee.paymentRef} onChange={(e) => setFee({ ...fee, paymentRef: e.target.value })} />
              </div>
            </div>
            <Button
              size="sm"
              disabled={busy || !fee.amount}
              onClick={() =>
                run(
                  () => createCaseFee(caseUuid, { ...fee, amount: Number(fee.amount), paidDate: fee.paidDate || undefined }),
                  fee.type === "DEPOSIT"
                    ? "Deposit recorded. It stays on the deposit ledger until the refund is logged."
                    : "Fee recorded"
                )
              }
            >
              Record {fee.type === "DEPOSIT" ? "deposit" : "fee"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Authority comments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {detail.comments.map((c) => (
            <div key={c.uuid} className="rounded-md bg-secondary/60 px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{c.raisedDate}</span>
                {c.reasonCode && <Badge className="bg-amber-500/15 text-amber-800">{c.reasonCode}</Badge>}
              </div>
              <p className="mt-1">{c.commentText}</p>
              {c.responseText && (
                <p className="mt-1 text-muted-foreground">Response: {c.responseText}</p>
              )}
            </div>
          ))}
          <div className="grid gap-2 sm:grid-cols-4">
            <Input
              className="sm:col-span-3"
              placeholder="Comment received from the authority"
              value={comment.commentText}
              onChange={(e) => setComment({ ...comment, commentText: e.target.value })}
            />
            <Input
              placeholder="Reason code"
              value={comment.reasonCode}
              onChange={(e) => setComment({ ...comment, reasonCode: e.target.value })}
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={busy || !comment.commentText.trim()}
            onClick={() =>
              run(() => createCaseComment(caseUuid, comment), "Comment logged").then(() =>
                setComment({ commentText: "", reasonCode: "" })
              )
            }
          >
            Log comment
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Audit trail</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/40">
            {detail.events.map((e) => (
              <div key={e.uuid} className="flex flex-wrap items-center gap-2 px-4 py-2 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-semibold">{e.action.replace(/_/g, " ").toLowerCase()}</span>
                {e.fromStatus && e.toStatus && e.fromStatus !== e.toStatus && (
                  <span className="text-muted-foreground">
                    {statusLabel(e.fromStatus)} to {statusLabel(e.toStatus)}
                  </span>
                )}
                {e.detail && <span className="text-muted-foreground">{e.detail}</span>}
                <span className="ml-auto text-muted-foreground">
                  {String(e.createdAt || "").slice(0, 16).replace("T", " ")}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
