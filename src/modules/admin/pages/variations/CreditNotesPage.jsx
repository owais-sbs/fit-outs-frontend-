import { useEffect, useState } from "react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { fetchAllProjects } from "@/modules/admin/api/projects.api";
import {
  createCreditNote, fetchCreditNotes, submitCreditNote,
} from "@/modules/admin/api/commercial-approvals.api";

const emptyForm = () => ({ title: "", amount: "", reason: "" });

export default function CreditNotesPage() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [notes, setNotes] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchAllProjects()
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setProjects(arr);
        if (arr[0]?.id) setProjectId(String(arr[0].id));
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!projectId) {
      setNotes([]);
      return;
    }
    setLoading(true);
    fetchCreditNotes(projectId)
      .then((list) => setNotes(Array.isArray(list) ? list : []))
      .catch((e) => {
        setNotes([]);
        setMessage(e?.response?.data?.message || e?.response?.data?.error || "Could not load credit notes");
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  const reload = () => {
    if (!projectId) return Promise.resolve();
    return fetchCreditNotes(projectId).then((list) => setNotes(Array.isArray(list) ? list : []));
  };

  const create = async () => {
    if (!projectId || !form.title.trim() || !form.amount) {
      setMessage("Title and amount are required");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await createCreditNote(projectId, {
        title: form.title.trim(),
        amount: Number(form.amount),
        reason: form.reason.trim() || null,
      });
      setForm(emptyForm());
      await reload();
      setMessage("Credit note saved as draft");
    } catch (e) {
      setMessage(e?.response?.data?.message || e?.response?.data?.error || "Create failed");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (uuid) => {
    setBusy(true);
    setMessage("");
    try {
      await submitCreditNote(projectId, uuid);
      await reload();
      setMessage("Submitted for approval. Approvers will see it in the variations inbox.");
    } catch (e) {
      setMessage(e?.response?.data?.message || e?.response?.data?.error || "Submit failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell>
      <PageTitle
        title="Credit notes"
        description="Raise a client credit. It follows the CREDIT_NOTE approval matrix before the contract value is reduced."
      />
      {message && <p className="text-sm text-muted-foreground mb-3">{message}</p>}

      <Surface className="p-4 space-y-4 mb-4">
        <div className="max-w-sm space-y-1">
          <Label>Project</Label>
          <Select value={projectId || undefined} onValueChange={setProjectId}>
            <SelectTrigger><SelectValue placeholder="Select a project" /></SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.projectName || p.name || `Project #${p.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Client credit for omitted works"
            />
          </div>
          <div>
            <Label>Amount</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <Label>Reason</Label>
          <Textarea
            rows={2}
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
          />
        </div>
        <Button disabled={busy || !projectId} onClick={create}>Save draft</Button>
      </Surface>

      <Surface className="p-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No credit notes on this project.</p>
        ) : (
          <div className="divide-y">
            {notes.map((note) => (
              <div key={note.uuid} className="flex flex-col sm:flex-row sm:items-center gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{note.noteNumber} — {note.title}</p>
                    <Badge variant="outline">{note.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {note.amount}
                    {note.reason ? ` · ${note.reason}` : ""}
                    {note.rejectComment ? ` · ${note.rejectComment}` : ""}
                  </p>
                </div>
                {(note.status === "DRAFT" || note.status === "REJECTED") && (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => submit(note.uuid)}>
                    Submit for approval
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Surface>
    </PageShell>
  );
}
