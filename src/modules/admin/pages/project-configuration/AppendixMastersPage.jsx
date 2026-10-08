import { useEffect, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import {
  createAppendixMaster,
  deleteAppendixMaster,
  fetchAppendixMasters,
  updateAppendixMaster,
} from "../../api/appendix.api";

export default function AppendixMastersPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", description: "", category: "" });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    fetchAppendixMasters(true)
      .then(setItems)
      .catch((e) => setError(e.response?.data?.error || "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !file) return;
    setSaving(true);
    setError("");
    try {
      await createAppendixMaster(form, file);
      setForm({ title: "", description: "", category: "" });
      setFile(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item) => {
    try {
      await updateAppendixMaster(item.uuid, { active: !item.active });
      load();
    } catch {
      /* ignore */
    }
  };

  const handleDelete = async (uuid) => {
    if (!window.confirm("Delete this appendix master?")) return;
    try {
      await deleteAppendixMaster(uuid);
      load();
    } catch {
      /* ignore */
    }
  };

  return (
    <PageShell className="max-w-none">
      <PageTitle
        title="Appendix masters"
        subtitle="Image-based appendix pages selectable when creating cover letters and draft BoQ estimates."
      />

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add appendix</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Finishes"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Image</Label>
              <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 text-sm text-muted-foreground hover:bg-muted/40">
                <ImagePlus className="h-4 w-4 shrink-0 text-[#C9A96E]" />
                <span className="truncate">{file ? file.name : "Choose image"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
            <div className="sm:col-span-2 xl:col-span-4">
              <Button type="submit" disabled={saving || !file}>
                {saving ? "Saving…" : "Add appendix master"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/10 px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">No appendix masters yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Add an image appendix above to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Card
              key={item.uuid}
              className={`overflow-hidden border-border/70 shadow-sm ${!item.active ? "opacity-60" : ""}`}
            >
              <CardContent className="space-y-3 p-4">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-40 w-full rounded-lg object-cover ring-1 ring-border/60"
                  />
                )}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold tracking-tight">{item.title}</p>
                    {item.category && (
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    )}
                  </div>
                  <Badge
                    className={
                      item.active
                        ? "shrink-0 border-[#C9A96E]/35 bg-[#C9A96E]/15 text-[#8a6d3b]"
                        : "shrink-0"
                    }
                    variant={item.active ? "outline" : "secondary"}
                  >
                    {item.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {item.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                )}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => toggleActive(item)}>
                    {item.active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(item.uuid)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
