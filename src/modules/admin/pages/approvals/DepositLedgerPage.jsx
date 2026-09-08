import { useCallback, useEffect, useState } from "react";
import { Coins, Loader2 } from "lucide-react";
import { PageShell, PageTitle, StatTile } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchDeposits, createCaseFee } from "../../api/approvals.api";
import { money } from "./approvalStatus";

/**
 * Refundable deposits are receivables, not costs. This screen exists so the total sitting
 * with third parties is a number somebody looks at, rather than money that quietly never
 * comes back.
 */
export default function DepositLedgerPage() {
  const [rows, setRows] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyUuid, setBusyUuid] = useState(null);
  const [refundDate, setRefundDate] = useState({});
  const [message, setMessage] = useState("");

  const load = useCallback(
    async (all) => {
      setLoading(true);
      try {
        const data = await fetchDeposits(all ? { status: "all" } : {});
        setRows(Array.isArray(data) ? data : []);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    load(showAll);
  }, [load, showAll]);

  const recordRefund = async (row) => {
    const received = refundDate[row.uuid] || new Date().toISOString().slice(0, 10);
    setBusyUuid(row.uuid);
    setMessage("");
    try {
      await createCaseFee(row.caseUuid, {
        uuid: row.uuid,
        type: row.type,
        amount: row.amount,
        currency: row.currency,
        paidDate: row.paidDate,
        paymentRef: row.paymentRef,
        refundable: true,
        refundReceivedDate: received,
        refundAmount: row.refundAmount ?? row.amount,
      });
      setMessage(`Refund recorded for ${row.caseNumber}`);
      await load(showAll);
    } catch (e) {
      setMessage(e?.response?.data?.error || "Could not record the refund");
    } finally {
      setBusyUuid(null);
    }
  };

  const outstanding = rows.filter((r) => !r.refundReceivedDate);
  const outstandingTotal = outstanding.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const oldest = outstanding.reduce(
    (max, r) => Math.max(max, Number(r.daysOutstanding) || 0),
    0
  );

  return (
    <PageShell>
      <PageTitle
        title="Deposit ledger"
        subtitle="Refundable deposits paid to communities and building managers."
        actions={
          <Button size="sm" variant="outline" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Show outstanding only" : "Show all deposits"}
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Held by third parties"
          value={money(outstandingTotal)}
          icon={Coins}
          hint={`${outstanding.length} deposits not yet refunded`}
        />
        <StatTile label="Oldest outstanding" value={oldest ? `${oldest} days` : "—"} />
        <StatTile label="Deposits on record" value={rows.length} />
      </div>

      {message && (
        <div className="rounded-lg bg-secondary px-4 py-3 text-sm text-foreground">{message}</div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading deposits
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              {showAll ? "All deposits" : "Outstanding deposits"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr className="border-b border-border/40">
                    <th className="px-4 py-2 font-semibold">Project</th>
                    <th className="px-4 py-2 font-semibold">Permit</th>
                    <th className="px-4 py-2 font-semibold">Held by</th>
                    <th className="px-4 py-2 font-semibold text-right">Amount</th>
                    <th className="px-4 py-2 font-semibold">Paid</th>
                    <th className="px-4 py-2 font-semibold">Outstanding</th>
                    <th className="px-4 py-2 font-semibold">Refund</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {rows.map((r) => (
                    <tr key={r.uuid} className="hover:bg-secondary/40">
                      <td className="px-4 py-2">{r.projectName || `Project ${r.projectId}`}</td>
                      <td className="px-4 py-2">
                        <div className="font-mono text-xs text-muted-foreground">{r.caseNumber}</div>
                        <div className="text-xs">{r.permitTypeName}</div>
                      </td>
                      <td className="px-4 py-2 text-xs">{r.authorityName || "—"}</td>
                      <td className="px-4 py-2 text-right font-semibold">
                        {money(r.amount, r.currency)}
                      </td>
                      <td className="px-4 py-2 text-xs">{r.paidDate || "not paid"}</td>
                      <td className="px-4 py-2 text-xs">
                        {r.refundReceivedDate ? (
                          <span className="text-emerald-700">
                            Refunded {r.refundReceivedDate}
                          </span>
                        ) : (
                          <span
                            className={
                              Number(r.daysOutstanding) > 60
                                ? "text-red-700 font-semibold"
                                : "text-amber-700"
                            }
                          >
                            {r.daysOutstanding != null ? `${r.daysOutstanding} days` : "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {r.refundReceivedDate ? (
                          money(r.refundAmount ?? r.amount, r.currency)
                        ) : (
                          <div className="flex items-center gap-2">
                            <Input
                              type="date"
                              className="h-8 w-36"
                              value={refundDate[r.uuid] || ""}
                              onChange={(e) =>
                                setRefundDate({ ...refundDate, [r.uuid]: e.target.value })
                              }
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busyUuid === r.uuid}
                              onClick={() => recordRefund(r)}
                            >
                              {busyUuid === r.uuid ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                "Received"
                              )}
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        No deposits recorded. They appear here once a deposit fee is logged
                        against an approval permit.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
