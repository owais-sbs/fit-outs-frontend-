import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  createScSubmittal, fetchMyScPackages, fetchScSubmittals,
} from "@/modules/admin/api/subcontractor.api";
import { SC_STATUS_BADGE, formatScStatus } from "../utils/subcontractor.utils";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

export default function SubcontractorSubmittalsPage() {
  const [submittals, setSubmittals] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    packageUuid: "",
    projectId: "",
    title: "",
    submittalType: "SHOP_DRAWING",
    reviewCode: "",
    filePaths: "",
  });

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([fetchScSubmittals(), fetchMyScPackages()])
      .then(([subList, pkgList]) => {
        setSubmittals(Array.isArray(subList) ? subList : []);
        setPackages(Array.isArray(pkgList) ? pkgList : []);
      })
      .catch((e) => setMessage(e?.response?.data?.error || "Failed to load submittals"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const onPackageChange = (packageUuid) => {
    const pkg = packages.find((p) => String(p.uuid) === packageUuid);
    setForm((f) => ({
      ...f,
      packageUuid,
      projectId: pkg?.projectId ? String(pkg.projectId) : f.projectId,
    }));
  };

  const create = async () => {
    if (!form.title.trim() || !form.packageUuid) {
      setMessage("Select a package and enter a title");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await createScSubmittal({
        packageUuid: form.packageUuid,
        projectId: form.projectId ? Number(form.projectId) : null,
        title: form.title.trim(),
        submittalType: form.submittalType,
        reviewCode: form.reviewCode.trim() || null,
        filePaths: form.filePaths.trim() || null,
      });
      setShowForm(false);
      setForm({
        packageUuid: "", projectId: "", title: "", submittalType: "SHOP_DRAWING",
        reviewCode: "", filePaths: "",
      });
      setMessage("Submittal created");
      load();
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Failed to create submittal");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin" /></div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageTitle
        title="Submittals"
        subtitle="Submit shop drawings, datasheets and technical documents for consultant review"
        actions={
          <Button size="sm" onClick={() => setShowForm((v) => !v)} disabled={packages.length === 0}>
            <Plus className="mr-2 h-4 w-4" /> New submittal
          </Button>
        }
      />

      {message && (
        <p className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">{message}</p>
      )}

      {showForm && (
        <Surface className="space-y-4 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Package</Label>
              <Select value={form.packageUuid} onValueChange={onPackageChange}>
                <SelectTrigger><SelectValue placeholder="Select package" /></SelectTrigger>
                <SelectContent>
                  {packages.map((p) => (
                    <SelectItem key={p.uuid} value={p.uuid}>
                      {p.name} · {p.projectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.submittalType} onValueChange={(v) => setForm((f) => ({ ...f, submittalType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SHOP_DRAWING">Shop drawing</SelectItem>
                  <SelectItem value="DATASHEET">Datasheet</SelectItem>
                  <SelectItem value="METHOD_STATEMENT">Method statement</SelectItem>
                  <SelectItem value="SAMPLE">Sample</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Review code</Label>
              <Input value={form.reviewCode} onChange={(e) => setForm((f) => ({ ...f, reviewCode: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>File paths (comma-separated)</Label>
            <Input
              value={form.filePaths}
              onChange={(e) => setForm((f) => ({ ...f, filePaths: e.target.value }))}
              placeholder="path/to/file.pdf"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={create} disabled={busy}>Save</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Surface>
      )}

      <Surface className="p-0 overflow-hidden">
        {submittals.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No submittals yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Rev</TableHead>
                <TableHead>Review code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submittals.map((s) => (
                <TableRow key={s.uuid}>
                  <TableCell className="font-medium">{s.title}</TableCell>
                  <TableCell className="text-xs">{formatScStatus(s.submittalType)}</TableCell>
                  <TableCell>R{s.revisionNo ?? 0}</TableCell>
                  <TableCell className="font-mono text-xs">{s.reviewCode || "—"}</TableCell>
                  <TableCell>
                    <Badge className={`${SC_STATUS_BADGE[s.status] || "bg-muted border-none"} text-[10px]`}>
                      {formatScStatus(s.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{formatDate(s.submittedAt || s.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Surface>
    </PageShell>
  );
}
