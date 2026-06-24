import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search, RotateCcw, MapPin, X,
  Building2, Users, LayoutGrid, CalendarDays,
  Eye, PlayCircle, Info, FileText, ClipboardList,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBoq, QAS_TOTAL_STEPS } from "../BoqEngine";
import { formatCurrency } from "../quantityCalcUtils";
import { fetchAllProjects } from "@/modules/admin/api/projects.api";
import { fetchAllClients } from "@/modules/admin/api/clients.api";

// ─── Static fallback projects (shown when API returns nothing) ────────────────
const MOCK_PROJECTS = [
  {
    id: "PRJ-001",
    projectName: "Sunset Boulevard Villa",
    name: "Sunset Boulevard Villa",
    clientId: "c1",
    location: "Dubai Marina, UAE",
    projectType: "Residential",
    status: "Active",
    isActive: true,
    createdAt: "2026-01-15T08:00:00Z",
    floors: 3,
    area: "450 m²",
  },
  {
    id: "PRJ-002",
    projectName: "Downtown Office Fit-out",
    name: "Downtown Office Fit-out",
    clientId: "c2",
    location: "Business Bay, Dubai",
    projectType: "Commercial",
    status: "Active",
    isActive: true,
    createdAt: "2026-02-20T08:00:00Z",
    floors: 1,
    area: "800 m²",
  },
  {
    id: "PRJ-003",
    projectName: "Palm Jumeirah Residence",
    name: "Palm Jumeirah Residence",
    clientId: "c3",
    location: "Palm Jumeirah, Dubai",
    projectType: "Residential",
    status: "Active",
    isActive: true,
    createdAt: "2026-03-05T08:00:00Z",
    floors: 4,
    area: "620 m²",
  },
  {
    id: "PRJ-004",
    projectName: "Al Quoz Warehouse Renovation",
    name: "Al Quoz Warehouse Renovation",
    clientId: "c4",
    location: "Al Quoz, Dubai",
    projectType: "Renovation",
    status: "Planning",
    isActive: false,
    createdAt: "2026-04-10T08:00:00Z",
    floors: 1,
    area: "1200 m²",
  },
  {
    id: "PRJ-005",
    projectName: "JBR Retail Fit-out",
    name: "JBR Retail Fit-out",
    clientId: "c5",
    location: "Jumeirah Beach Residence",
    projectType: "Interior",
    status: "Active",
    isActive: true,
    createdAt: "2026-05-01T08:00:00Z",
    floors: 2,
    area: "350 m²",
  },
];

const MOCK_CLIENT_MAP = new Map([
  ["c1", { fullName: "Omar Farooq" }],
  ["c2", { fullName: "Tech Corp LLC" }],
  ["c3", { fullName: "Sarah Al-Khalid" }],
  ["c4", { fullName: "Gulf Logistics" }],
  ["c5", { fullName: "Retail Masters" }],
]);

const PROJECT_TYPES = ["All Types", "Commercial", "Residential", "Interior", "Renovation", "Construction"];

// ─── Project Summary Drawer ───────────────────────────────────────────────────
function ProjectDrawer({ project, clientName, projectDrafts, onClose, onStart, onResumeBoq, onResumeQas }) {
  if (!project) return null;
  const { boq: boqDrafts = [], qas: qasDrafts = [] } = projectDrafts || {};

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col bg-background shadow-2xl border-l border-border/60 animate-in slide-in-from-right duration-300">
        {/* header */}
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Project Summary</p>
            <h2 className="font-bold text-lg mt-0.5 leading-tight">{project.projectName || project.name}</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant={project.isActive ? "success" : "secondary"}>
              {project.isActive ? "Active" : "Inactive"}
            </Badge>
            <Badge variant="outline" className="text-xs capitalize">{project.projectType || "—"}</Badge>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/20 divide-y divide-border/40">
            <InfoRow icon={Building2}   label="Project ID"  value={`#${project.id}`} />
            <InfoRow icon={Users}       label="Client"      value={clientName || "—"} />
            <InfoRow icon={MapPin}      label="Location"    value={project.location || "—"} />
            <InfoRow icon={LayoutGrid}  label="Type"        value={project.projectType || "—"} />
            <InfoRow icon={CalendarDays} label="Created"    value={project.createdAt ? new Date(project.createdAt).toLocaleDateString("en-AU") : "—"} />
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Saved Work</p>
            {boqDrafts.length === 0 && qasDrafts.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Info className="h-4 w-4 shrink-0" />
                <p className="text-sm">No saved drafts — click below to begin.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {boqDrafts.map((draft) => (
                  <div key={draft.projectId} className="flex items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{draft.boqRef}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {draft.status} · {formatCurrency(draft.grandTotal)}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={() => onResumeBoq(draft.entry)}>
                      Open BOQ
                    </Button>
                  </div>
                ))}
                {qasDrafts.map((draft) => (
                  <div key={draft.projectId} className="flex items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{draft.qasRef}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Survey in progress · {draft.roomCount} room{draft.roomCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={() => onResumeQas(draft.entry)}>
                      Resume
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* footer */}
        <div className="border-t border-border/60 p-6 space-y-3">
          <Button className="w-full gap-2 shadow-md shadow-primary/30" onClick={() => onStart(project)}>
            <PlayCircle className="h-4 w-4" />
            Start QAS
          </Button>
          <Button variant="outline" className="w-full" onClick={onClose}>Cancel</Button>
        </div>
      </aside>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="flex flex-1 items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold text-right truncate max-w-[180px]">{value}</span>
      </div>
    </div>
  );
}

// ─── Main Step 1 ─────────────────────────────────────────────────────────────
export default function Step01ProjectSelection() {
  const { startSession, resumeSession, listStoredBoqDrafts, listStoredQasDrafts, getDraftsForProject } = useBoq();

  const [projects, setProjects]   = useState([]);
  const [clientMap, setClientMap] = useState(new Map());
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filterType, setType]     = useState("All Types");
  const [selected, setSelected]   = useState(null);
  const [boqDrafts, setBoqDrafts] = useState([]);
  const [qasDrafts, setQasDrafts] = useState([]);

  const refreshDrafts = useCallback(() => {
    setBoqDrafts(listStoredBoqDrafts());
    setQasDrafts(listStoredQasDrafts());
  }, [listStoredBoqDrafts, listStoredQasDrafts]);

  useEffect(() => {
    refreshDrafts();
  }, [refreshDrafts]);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchAllProjects(),
      fetchAllClients().catch(() => []),
    ])
      .then(([projs, clients]) => {
        // If API returns nothing, use mock data so user can always proceed
        if (projs.length === 0) {
          setProjects(MOCK_PROJECTS);
          setClientMap(MOCK_CLIENT_MAP);
        } else {
          setProjects(projs);
          setClientMap(new Map(clients.map((c) => [String(c.id), c])));
        }
      })
      .catch(() => {
        setProjects(MOCK_PROJECTS);
        setClientMap(MOCK_CLIENT_MAP);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      const clientName = clientMap.get(String(p.clientId))?.fullName || "";
      const matchQ = !q || [p.id, p.name, p.projectName, clientName, p.location]
        .some((v) => String(v || "").toLowerCase().includes(q));
      const matchType =
        filterType === "All Types" ||
        (p.projectType || "").toLowerCase() === filterType.toLowerCase();
      return matchQ && matchType;
    });
  }, [projects, search, filterType, clientMap]);

  const selectedClient = selected
    ? clientMap.get(String(selected.clientId))?.fullName || "—"
    : "";

  const handleResumeBoq = (entry) => {
    setSelected(null);
    resumeSession(entry);
  };

  const handleResumeQas = (entry) => {
    setSelected(null);
    resumeSession(entry);
  };

  return (
    <div className="space-y-5">
      {/* ── Step header ── */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-1">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold">1</span>
          Step 1 of {QAS_TOTAL_STEPS}
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Project Selection</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Select a project to begin the QAS workflow.
        </p>
      </div>

      {(boqDrafts.length > 0 || qasDrafts.length > 0) && (
        <Card className="border-primary/20 shadow-sm">
          <CardHeader className="border-b border-border/60 bg-primary/5 py-3 px-6">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Saved Drafts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/10">
                    {["Type", "Reference", "Project", "Status", "Saved", "Total", ""].map((h) => (
                      <th key={h} className="py-2.5 px-4 first:pl-6 last:pr-6 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {boqDrafts.map((draft) => (
                    <tr key={draft.projectId} className="hover:bg-muted/20">
                      <td className="py-3 px-4 pl-6">
                        <Badge variant="outline" className="text-[10px]">BOQ</Badge>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">{draft.boqRef}</td>
                      <td className="py-3 px-4 font-medium">{draft.projectName}</td>
                      <td className="py-3 px-4">
                        <Badge variant={draft.status === "final" ? "default" : "secondary"} className="text-xs capitalize">
                          {draft.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {draft.savedAt ? new Date(draft.savedAt).toLocaleString("en-AE") : "—"}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold tabular-nums">
                        {formatCurrency(draft.grandTotal)}
                      </td>
                      <td className="py-3 px-4 pr-6 text-right">
                        <Button size="sm" className="h-7 text-xs gap-1" onClick={() => handleResumeBoq(draft.entry)}>
                          <FileText className="h-3.5 w-3.5" /> Open BOQ
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {qasDrafts.map((draft) => (
                    <tr key={draft.projectId} className="hover:bg-muted/20">
                      <td className="py-3 px-4 pl-6">
                        <Badge variant="outline" className="text-[10px]">QAS Survey</Badge>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">{draft.qasRef}</td>
                      <td className="py-3 px-4 font-medium">{draft.projectName}</td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary" className="text-xs">In progress</Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {draft.savedAt ? new Date(draft.savedAt).toLocaleString("en-AE") : "—"}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {draft.roomCount} room{draft.roomCount !== 1 ? "s" : ""}
                      </td>
                      <td className="py-3 px-4 pr-6 text-right">
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleResumeQas(draft.entry)}>
                          <ClipboardList className="h-3.5 w-3.5" /> Resume Survey
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Filter bar ── */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search project, client, location…"
                className="pl-9 bg-muted/30"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setType(e.target.value)}
              className="h-9 rounded-md border border-input bg-muted/30 px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {PROJECT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            {(search || filterType !== "All Types") && (
              <Button
                variant="ghost" size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => { setSearch(""); setType("All Types"); }}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Projects table ── */}
      <Card className="overflow-hidden border-border/60 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/20 py-3 px-6 flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">
            {filtered.length} Project{filtered.length !== 1 ? "s" : ""}
          </CardTitle>
          {loading && (
            <span className="text-xs text-muted-foreground animate-pulse">Loading…</span>
          )}
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/10">
                {["ID", "Project Name", "Client", "Location", "Type", "Created", "Status", "Actions"].map((h) => (
                  <th key={h} className="py-3 px-4 first:pl-6 last:pr-6 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="py-4 px-4 first:pl-6">
                        <div className="h-4 bg-muted rounded w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <Building2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/20" />
                    <p className="font-medium text-muted-foreground">No projects match your search</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Try different keywords</p>
                  </td>
                </tr>
              ) : (
                filtered.map((project) => {
                  const clientName = clientMap.get(String(project.clientId))?.fullName || "—";
                  const projectDrafts = getDraftsForProject(project.id, boqDrafts, qasDrafts);
                  const projectBoq = projectDrafts.boq[0];
                  const projectQas = projectDrafts.qas[0];
                  return (
                    <tr
                      key={project.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => setSelected(project)}
                    >
                      <td className="py-3.5 px-4 pl-6 font-mono text-xs font-semibold text-muted-foreground group-hover:text-primary">
                        #{project.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold">{project.projectName || project.name}</p>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground text-sm">{clientName}</td>
                      <td className="py-3.5 px-4 text-muted-foreground text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                          {project.location || "—"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className="text-xs capitalize">
                          {project.projectType || "—"}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {project.createdAt ? new Date(project.createdAt).toLocaleDateString("en-AU") : "—"}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <Badge variant={project.isActive ? "success" : "secondary"} className="text-xs">
                            {project.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {projectBoq && (
                            <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                              BOQ draft
                            </Badge>
                          )}
                          {!projectBoq && projectQas && (
                            <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300">
                              Survey in progress
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 pr-6">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1 text-xs"
                            onClick={(e) => { e.stopPropagation(); setSelected(project); }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 gap-1 text-xs"
                            onClick={(e) => { e.stopPropagation(); startSession(project); }}
                          >
                            {projectBoq ? (
                              <><FileText className="h-3.5 w-3.5" /> Open BOQ</>
                            ) : projectQas ? (
                              <><ClipboardList className="h-3.5 w-3.5" /> Resume Survey</>
                            ) : (
                              <><PlayCircle className="h-3.5 w-3.5" /> Start QAS</>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border/60 px-6 py-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {filtered.length} of {projects.length} projects
          </p>
          {projects === MOCK_PROJECTS && (
            <p className="text-xs text-amber-600 font-medium">
             
            </p>
          )}
        </div>
      </Card>

      {/* Drawer */}
      {selected && (
        <ProjectDrawer
          project={selected}
          clientName={selectedClient}
          projectDrafts={getDraftsForProject(selected.id, boqDrafts, qasDrafts)}
          onClose={() => setSelected(null)}
          onStart={(p) => { setSelected(null); startSession(p); }}
          onResumeBoq={handleResumeBoq}
          onResumeQas={handleResumeQas}
        />
      )}
    </div>
  );
}
