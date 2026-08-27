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
    <PageShell className="p-6">
      <PageTitle
        title="Appendix masters"
        subtitle="Image-based appendix pages selectable when creating cover letters and draft BoQ estimates."
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add appendix</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Finishes"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 text-sm text-muted-foreground">
                <ImagePlus className="h-4 w-4" />
                {file ? file.name : "Choose image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <Button type="submit" disabled={saving || !file}>
                {saving ? "Saving…" : "Add appendix master"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.uuid} className={!item.active ? "opacity-60" : ""}>
              <CardContent className="p-4 space-y-3">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-40 w-full rounded-xl object-cover"
                  />
                )}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    {item.category && (
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    )}
                  </div>
                  <Badge variant={item.active ? "success" : "secondary"}>
                    {item.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                )}
                <div className="flex gap-2">
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
