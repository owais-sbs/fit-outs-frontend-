import { useState } from "react";
import { Plus, Trash2, Layers, ChevronRight, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBoq } from "../BoqEngine";

const FLOOR_SUGGESTIONS = [
  "Basement", "Ground Floor", "First Floor", "Second Floor",
  "Third Floor", "Fourth Floor", "Fifth Floor", "Roof / Terrace",
];

export default function Step02FloorSetup() {
  const { floors, setFloors, nextStep, prevStep, session } = useBoq();
  const [name, setName] = useState("");

  const addFloor = (floorName) => {
    const n = floorName || name.trim();
    if (!n) return;
    // avoid duplicates
    if (floors.find((f) => f.name.toLowerCase() === n.toLowerCase())) return;
    setFloors((f) => [...f, { id: "floor_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now(), name: n }]);
    setName("");
  };

  const remove = (id) => setFloors((f) => f.filter((x) => x.id !== id));

  const handleKeyDown = (e) => {
    if (e.key === "Enter") addFloor();
  };

  return (
    <div className="space-y-6">
      {/* Step header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-1">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold">
            2
          </span>
          Step 2 of 5
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Floor Setup</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Add every floor in the project. You can type a custom name or pick from suggestions.
        </p>
      </div>

      {/* Session badge */}
      {session && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm">
          <Layers className="h-4 w-4 text-primary shrink-0" />
          <span className="font-mono font-semibold text-primary">{session.ref}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">
            {session.project?.projectName || session.project?.name}
          </span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Add floor ── */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="border-b border-border/60 bg-muted/20 py-3 px-6">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Floor
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Custom name input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Floor Name
              </label>
              <div className="flex gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. Ground Floor, Penthouse…"
                  className="flex-1"
                />
                <Button onClick={() => addFloor()} disabled={!name.trim()} className="gap-1.5 shrink-0">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
            </div>

            {/* Quick-pick suggestions */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Quick add
              </p>
              <div className="flex flex-wrap gap-2">
                {FLOOR_SUGGESTIONS.map((s) => {
                  const already = floors.some((f) => f.name.toLowerCase() === s.toLowerCase());
                  return (
                    <button
                      key={s}
                      disabled={already}
                      onClick={() => addFloor(s)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-all
                        ${already
                          ? "border-primary/30 bg-primary/10 text-primary cursor-not-allowed"
                          : "border-border bg-muted/30 hover:border-primary/50 hover:bg-primary/8 hover:text-primary cursor-pointer"
                        }`}
                    >
                      {already ? "✓ " : ""}{s}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Floor list ── */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="border-b border-border/60 bg-muted/20 py-3 px-5">
            <CardTitle className="text-sm font-semibold">
              {floors.length} Floor{floors.length !== 1 ? "s" : ""} added
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {floors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                <Building2 className="h-12 w-12 text-muted-foreground/20 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No floors yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Type a name or click a quick-add button
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border/40">
                {floors.map((f, i) => (
                  <li
                    key={f.id}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/20 group"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="flex-1 font-semibold text-sm">{f.name}</span>
                    <button
                      onClick={() => remove(f.id)}
                      className="opacity-0 group-hover:opacity-100 rounded p-1.5 hover:bg-destructive/10 text-destructive transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={prevStep}>Back</Button>
        <Button onClick={nextStep} disabled={floors.length === 0} className="gap-2">
          Next: Room Creation
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
