import { createPortal } from "react-dom";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Confirm / result overlay for schedule Apply cascade.
 * Portaled to document.body so it centers over the full viewport.
 */
export default function ApplyCascadeOverlay({
  phase,
  preview,
  result,
  busy,
  onCancel,
  onFinalize,
  onDone,
}) {
  const source = phase === "result" ? result?.preview || preview || {} : preview || {};
  const activities = source.activities || [];
  const packagesFromApi =
    phase === "result" ? result?.packagesUpserted || [] : source.packages || [];
  const packages =
    packagesFromApi.length > 0
      ? packagesFromApi
      : Object.values(
          activities.reduce((acc, a) => {
            const code = a.tradePackageCode;
            if (!code) return acc;
            if (!acc[code]) {
              acc[code] = {
                tradePackageCode: code,
                name: code,
                activityCount: 0,
                plannedStart: a.earlyStart,
                plannedFinish: a.earlyFinish,
              };
            }
            acc[code].activityCount += 1;
            if (a.earlyStart && (!acc[code].plannedStart || a.earlyStart < acc[code].plannedStart)) {
              acc[code].plannedStart = a.earlyStart;
            }
            if (
              a.earlyFinish &&
              (!acc[code].plannedFinish || a.earlyFinish > acc[code].plannedFinish)
            ) {
              acc[code].plannedFinish = a.earlyFinish;
            }
            return acc;
          }, {})
        );

  const billing = phase === "result" ? result?.billingMilestonesCreated || [] : null;
  const holds = phase === "result" ? result?.holdPointsCreated || [] : null;
  const holdCandidates = activities.filter((a) => a.lockedDuration || a.constraintNote);
  const approvals =
    phase === "result" ? result?.approvalTargetsUpdated || [] : source.approvalTargets || [];
  const orderBy = source.orderByDates || [];
  const criticalPaths = source.criticalPaths || [];
  const criticalCount = activities.filter((a) => a.critical).length;
  const depsCount = (source.dependencies || []).length;
  const orderByCount =
    phase === "result" ? result?.orderByRowsWritten ?? orderBy.length : orderBy.length;

  const dialog = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 p-3 sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-cascade-title"
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white text-black shadow-2xl"
      >
        <div className="shrink-0 border-b border-neutral-200 bg-neutral-50 px-5 py-4 sm:px-6">
          <p id="apply-cascade-title" className="text-lg font-semibold text-black">
            {phase === "confirm"
              ? "Confirm apply and publish"
              : "Programme published — cascade complete"}
          </p>
          <p className="mt-1 text-sm text-black">
            {phase === "confirm"
              ? "Review where each record will go. Nothing is saved until you click Finalize."
              : result?.note ||
                "The CPM engine wrote the programme and cascaded related records."}
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 text-sm text-black sm:px-6">
          <CascadeDestination
            step="1"
            module="Gantt · Module 14"
            title="CPM programme"
            summary={
              phase === "result"
                ? `${result?.activitiesWritten ?? 0} activities written to this project’s live schedule`
                : `${source.activityCount ?? activities.length} activities will replace the current programme on this project`
            }
          >
            <div className="grid gap-2 sm:grid-cols-3">
              <CascadeStat label="Finish date" value={source.finishDate} />
              <CascadeStat
                label="Working days"
                value={source.workingDays ?? result?.activitiesWritten}
                hint={
                  source.calendarDays != null ? `${source.calendarDays} calendar days` : undefined
                }
              />
              <CascadeStat
                label={phase === "result" ? "Written" : "Activities"}
                value={phase === "result" ? result?.activitiesWritten : source.activityCount}
                hint={
                  phase === "result"
                    ? `${result?.dependenciesWritten ?? 0} deps · ${result?.activitiesReplaced ?? 0} replaced`
                    : `${criticalCount} critical · ${depsCount || "—"} logic links`
                }
              />
            </div>
            {source.targetVarianceNote && (
              <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                {source.targetVarianceNote}
              </p>
            )}
            {!!criticalPaths.length && (
              <div className="mt-3 space-y-2">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-black">
                  Longest paths → Gantt baseline
                </p>
                {criticalPaths.slice(0, 3).map((path, index) => (
                  <div key={`path-${index}-${(path || []).join(">")}`} className="space-y-1">
                    <p className="text-[11px] font-semibold text-black">
                      {index === 0 ? "Path 1 · Critical" : `Path ${index + 1}`}
                    </p>
                    <p className="break-all rounded-md bg-neutral-100 px-3 py-2 font-mono text-xs text-black">
                      {(path || []).join(" → ")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CascadeDestination>

          <CascadeDestination
            step="2"
            module="Module 13 · Subcontractor"
            title="Package shells"
            summary={`${packages.length} trade package shell${packages.length === 1 ? "" : "s"} ${
              phase === "result" ? "created / updated" : "will be created"
            } with planned dates spanning that trade’s activities`}
          >
            {packages.length === 0 ? (
              <p className="text-sm text-black">No trade codes on activities — no package shells.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-neutral-200">
                <table className="w-full text-left text-sm text-black">
                  <thead className="bg-neutral-100 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="px-3 py-2 font-semibold text-black">Package / trade</th>
                      <th className="px-3 py-2 font-semibold text-black">Activities</th>
                      <th className="px-3 py-2 font-semibold text-black">Planned window</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packages.map((p) => (
                      <tr key={p.tradePackageCode || p.name} className="border-t border-neutral-200">
                        <td className="px-3 py-2 font-medium text-black">
                          {p.name || p.tradePackageCode}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-black">
                          {p.activityCount ?? "—"}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-black">
                          {p.plannedStart && p.plannedFinish
                            ? `${p.plannedStart} → ${p.plannedFinish}`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CascadeDestination>

          <CascadeDestination
            step="3"
            module="Module 20 · Billing"
            title="Payment milestones (DRAFT)"
            summary={
              phase === "result"
                ? `${billing?.length ?? 0} DRAFT milestone${
                    (billing?.length ?? 0) === 1 ? "" : "s"
                  } seeded for Finance → Billing → From schedule`
                : "Template payment gates will be seeded as DRAFT milestones (linked to schedule activities where matched)"
            }
          >
            {phase === "result" ? (
              billing?.length ? (
                <ul className="space-y-1.5 text-sm text-black">
                  {billing.map((name) => (
                    <li key={name} className="flex gap-2">
                      <span className="text-black/50">→</span>
                      <span>{name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-black">
                  No drafts seeded (budget/BOQ may be zero, or non-draft rows blocked upsert).
                </p>
              )
            ) : (
              <ul className="list-disc space-y-1 pl-5 text-sm text-black">
                <li>Creates DRAFT client payment gates from the applied template presets</li>
                <li>Amounts use project budget, else approved BOQ total</li>
                <li>
                  Due dates follow linked activity early finishes (retention +12 months after finish)
                </li>
                <li>
                  Does not start PM → Director → client approval until Finance submits
                </li>
              </ul>
            )}
          </CascadeDestination>

          <CascadeDestination
            step="4"
            module="Module 42 · Quality"
            title="Hold points"
            summary={
              phase === "result"
                ? `${holds?.length ?? 0} hold point${(holds?.length ?? 0) === 1 ? "" : "s"} created`
                : `${holdCandidates.length} locked / constrained activit${
                    holdCandidates.length === 1 ? "y" : "ies"
                  } may receive quality hold points`
            }
          >
            {phase === "result" ? (
              holds?.length ? (
                <ul className="space-y-1.5 text-sm text-black">
                  {holds.slice(0, 15).map((h) => (
                    <li key={h} className="flex gap-2">
                      <span className="text-black/50">→</span>
                      <span>{h}</span>
                    </li>
                  ))}
                  {holds.length > 15 && (
                    <li className="text-black">…and {holds.length - 15} more</li>
                  )}
                </ul>
              ) : (
                <p className="text-sm text-black">No new hold points.</p>
              )
            ) : holdCandidates.length ? (
              <div className="overflow-x-auto rounded-lg border border-neutral-200">
                <table className="w-full text-left text-sm text-black">
                  <thead className="bg-neutral-100 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="px-3 py-2 font-semibold text-black">Activity</th>
                      <th className="px-3 py-2 font-semibold text-black">Constraint</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdCandidates.slice(0, 12).map((a) => (
                      <tr key={a.activityCode} className="border-t border-neutral-200">
                        <td className="px-3 py-2 font-mono text-xs text-black">{a.activityCode}</td>
                        <td className="px-3 py-2 text-black">
                          {a.constraintNote || (a.lockedDuration ? "Locked duration" : "—")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {holdCandidates.length > 12 && (
                  <p className="border-t border-neutral-200 px-3 py-2 text-xs text-black">
                    …and {holdCandidates.length - 12} more candidates
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-black">No locked/constraint activities in this preview.</p>
            )}
          </CascadeDestination>

          <CascadeDestination
            step="5"
            module="Module 52 · Approvals"
            title="Approval target dates"
            summary={
              approvals.length
                ? `${approvals.length} permit target${approvals.length === 1 ? "" : "s"} ${
                    phase === "result" ? "refreshed against programme dates" : "tied to programme dates"
                  }`
                : "No Module 52 approval cases on this project yet — create permits first, or they will stay empty after finalize"
            }
          >
            {approvals.length === 0 ? (
              <p className="text-sm text-black">
                Approvals appear here when this project already has approval cases that block programme
                activities (e.g. community NOC → mobilisation). Preview computes target submission /
                required-by dates from the CPM plan without saving. If none exist yet, Finalize will not
                invent new cases.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-neutral-200">
                <table className="w-full text-left text-sm text-black">
                  <thead className="bg-neutral-100 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="px-3 py-2 font-semibold text-black">Permit</th>
                      <th className="px-3 py-2 font-semibold text-black">Blocks</th>
                      <th className="px-3 py-2 font-semibold text-black">Needed by</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvals.slice(0, 12).map((a) => (
                      <tr
                        key={`${a.permitTypeCode}-${a.blocksActivityCode}`}
                        className="border-t border-neutral-200"
                      >
                        <td className="px-3 py-2 text-black">
                          {a.permitTypeName || a.permitTypeCode}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-black">
                          {a.blocksActivityCode || "—"}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-black">
                          {a.requiredApprovalDate || "—"}
                          {a.atRisk ? " · at risk" : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CascadeDestination>

          <CascadeDestination
            step="6"
            module="Procurement"
            title="Order-by dates"
            summary={`${orderByCount} buying deadline${orderByCount === 1 ? "" : "s"} ${
              phase === "result" ? "written" : "will be written"
            } (lead time back from install start)`}
          >
            {orderBy.length === 0 ? (
              <p className="text-sm text-black">No order-by rows for this programme.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-neutral-200">
                <table className="w-full text-left text-sm text-black">
                  <thead className="bg-neutral-100 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="px-3 py-2 font-semibold text-black">Item</th>
                      <th className="px-3 py-2 font-semibold text-black">Lead</th>
                      <th className="px-3 py-2 font-semibold text-black">Install</th>
                      <th className="px-3 py-2 font-semibold text-black">Order by</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderBy.map((r) => (
                      <tr
                        key={`${r.itemName}-${r.orderByDate}`}
                        className={`border-t border-neutral-200 ${r.overdue ? "bg-red-50" : ""}`}
                      >
                        <td className="px-3 py-2 font-medium text-black">{r.itemName}</td>
                        <td className="px-3 py-2 tabular-nums text-black">
                          {r.leadTimeCalendarDays ?? "—"}d
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-black">
                          {r.installActivityCode || "—"}
                          {r.installStartDate ? ` · ${r.installStartDate}` : ""}
                        </td>
                        <td
                          className={`px-3 py-2 tabular-nums ${
                            r.overdue ? "font-semibold text-red-700" : "text-black"
                          }`}
                        >
                          {r.orderByDate || "—"}
                          {r.overdue ? " · passed" : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CascadeDestination>

          <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-black">
            <p className="font-semibold text-black">What this means</p>
            <p className="mt-1.5 leading-relaxed text-black">
              {phase === "confirm"
                ? "Finalize writes the Gantt baseline on this project, then cascades package shells (13), billing drafts (20), hold points (42), approval dates, and order-by buying deadlines in one action."
                : "The Gantt is now the live baseline. Packages are shells not awards. Billing drafts wait for Finance. Hold points block quality sign-off until cleared. Miss an order-by date and the finish slips."}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-neutral-200 bg-neutral-50 px-5 py-3 sm:px-6">
          {phase === "confirm" ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="border-neutral-300 text-black"
                onClick={onCancel}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={onFinalize} disabled={busy}>
                {busy ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-1" />
                )}
                Finalize apply and publish
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={onDone} disabled={busy}>
              Done / View schedule
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(dialog, document.body);
}

function CascadeDestination({ step, module, title, summary, children }) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start gap-2">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-black">{title}</h3>
            <span className="rounded-full border border-neutral-300 bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-black">
              {module}
            </span>
          </div>
          <p className="mt-1 text-sm text-black">{summary}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function CascadeStat({ label, value, hint }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-black">{label}</p>
      <p className="text-lg font-semibold text-black">{value ?? "—"}</p>
      {hint && <p className="text-[11px] text-black">{hint}</p>}
    </div>
  );
}
