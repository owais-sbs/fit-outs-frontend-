import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchQualityTemplates,
  fetchQualityTemplate,
  updateQualityTemplate,
} from "../../api/validation.api";

export default function QualityTemplatesPage() {
  const location = useLocation();
  const isPm = location.pathname.startsWith("/project-manager");

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [activityType, setActivityType] = useState("");
  const [checklistItems, setChecklistItems] = useState([""]);

  const load = useCallback(() => {
    setLoading(true);
    fetchQualityTemplates()
      .then((list) => setTemplates(Array.isArray(list) ? list : []))
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadOne = async (type) => {
    setBusy(true);
    setMessage("");
    try {
      const tpl = await fetchQualityTemplate(type);
      setActivityType(tpl.activityType || type);
      const items = tpl.checklistItems || [];
      setChecklistItems(items.length ? items : [""]);
    } catch {
      setMessage("Could not load template");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    const type = activityType.trim();
    if (!type) {
      setMessage("Activity type is required");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const items = checklistItems.map((s) => s.trim()).filter(Boolean);
      await updateQualityTemplate(type, { checklistItems: items });
      setMessage("Template saved");
      await load();
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <PageShell className="max-w-3xl mx-auto flex justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </PageShell>
    );
  }

  return (
    <PageShell className="max-w-3xl mx-auto">
      <PageTitle
        title="Quality templates"
        subtitle="Checklist templates for hold points, keyed by activity type"
      />

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Saved templates ({templates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No templates yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => (
                <Button
                  key={t.activityType}
                  type="button"
                  size="sm"
                  variant={activityType === t.activityType ? "default" : "outline"}
                  disabled={busy}
                  onClick={() => loadOne(t.activityType)}
                >
                  {t.activityType}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            {activityType ? `Edit — ${activityType}` : "New template"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Activity type</Label>
            <Input
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              placeholder="MEP_INSTALL"
              disabled={busy}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Checklist items</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setChecklistItems((items) => [...items, ""])}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </div>
            {checklistItems.map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) =>
                    setChecklistItems((items) => {
                      const next = [...items];
                      next[idx] = e.target.value;
                      return next;
                    })
                  }
                  placeholder={`Check ${idx + 1}`}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="shrink-0"
                  onClick={() =>
                    setChecklistItems((items) =>
                      items.length <= 1 ? [""] : items.filter((_, i) => i !== idx)
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button size="sm" disabled={busy} onClick={save}>
              <Save className="h-4 w-4 mr-1" /> Save template
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setActivityType("");
                setChecklistItems([""]);
              }}
            >
              Clear
            </Button>
          </div>

          {!isPm && (
            <p className="text-[11px] text-muted-foreground">
              PMs can load these templates when creating hold points on project validation pages.
            </p>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
