import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Building2, Briefcase, Mail,
  MoreHorizontal, Phone, PhoneIncoming, PhoneOutgoing,
} from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { fetchClientById } from "../../api/clients.api";
import { createProject, fetchAllProjects } from "../../api/projects.api";
import { CLIENT_STATUSES, INITIAL_CALLS, INITIAL_EMAIL_THREADS } from "../../data/clients";
import { ROUTES } from "@/shared/constants/routes";
import { useAuth } from "@/shared/context/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const STATUS_VARIANT = {
  Active: "success", Inactive: "secondary", Prospect: "warning", VIP: "default",
};

const AVATAR_HEX = ["7C3AED","0284C7","059669","B45309","BE123C","4338CA","0F766E","C2410C"];
function avatarUrl(name = "") {
  const idx = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_HEX.length;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${AVATAR_HEX[idx]}&color=ffffff&size=128&bold=true&format=svg`;
}
function initials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-border/40 last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value || "—"}</span>
    </div>
  );
}

export default function ClientDetailPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [projectOpen, setProjectOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectSaving, setProjectSaving] = useState(false);
  const [projectError, setProjectError] = useState("");
  const [projectSuccess, setProjectSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchClientById(clientId)
      .then((data) => {
        if (cancelled) return;
        setClient(data);
        return fetchAllProjects().then((all) => {
          if (!cancelled) setProjects(all.filter((p) => String(p.clientId) === String(clientId)));
        });
      })
      .catch(() => { if (!cancelled) setClient(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [clientId]);

  const calls   = INITIAL_CALLS.filter((c) => c.clientId === clientId);
  const threads = INITIAL_EMAIL_THREADS.filter((t) => t.clientId === clientId);

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      setProjectError("Project name is required");
      return;
    }
    setProjectSaving(true);
    setProjectError("");
    try {
      const created = await createProject({ name: projectName.trim(), clientId: client.id, companyId: user?.companyId });
      setProjects((prev) => [...prev, created]);
      setProjectSuccess(true);
      setProjectName("");
      setTimeout(() => { setProjectOpen(false); setProjectSuccess(false); }, 1500);
    } catch (err) {
      setProjectError(err.response?.data?.error || err.response?.data?.message || "Failed to create project");
    } finally {
      setProjectSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Loading..."
          actions={
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate(ROUTES.ADMIN.CLIENTS)}>
              <ArrowLeft className="h-4 w-4" /> All Clients
            </Button>
          }
        />
        <Card className="border-border/60 shadow-sm"><CardContent className="py-16"><Skeleton className="h-8 w-48 mx-auto" /></CardContent></Card>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate(ROUTES.ADMIN.CLIENTS)}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Card className="border-border/60">
          <CardContent className="py-24 text-center">
            <Building2 className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="font-medium">Client not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = client.fullName || "Unnamed";
  const displayCompany = client.companyName || "—";
  const displayStatus = client.active ? "Active" : "Inactive";

  return (
    <div className="space-y-6">
      <PageHeader
        title={displayName}
        description={displayCompany}
        actions={
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate(ROUTES.ADMIN.CLIENTS)}>
            <ArrowLeft className="h-4 w-4" /> All Clients
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[260px_1fr]">
        <Card className="border-border/60 shadow-sm self-start">
          <CardContent className="p-6 text-center space-y-4">
            <Avatar className="mx-auto h-20 w-20 ring-4 ring-border/40 ring-offset-2 ring-offset-background">
              <img src={avatarUrl(displayName)} alt={displayName} className="h-full w-full rounded-full object-cover" />
              <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
                {initials(displayName)}
              </AvatarFallback>
            </Avatar>

            <div>
              <h2 className="text-base font-bold">{displayName}</h2>
              <p className="text-sm text-muted-foreground">{displayCompany}</p>
            </div>

            <Badge variant={STATUS_VARIANT[displayStatus]} className="capitalize">
              {displayStatus}
            </Badge>

            <Separator />

            <div className="space-y-2.5 text-left">
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate text-xs">{client.email || "—"}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs">{client.phone || "—"}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              {client.phone && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 justify-start"
                  onClick={() => window.open(`tel:${client.phone}`)}
                >
                  <Phone className="h-3.5 w-3.5" />
                  Call {displayName.split(" ")[0]}
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 justify-start"
                onClick={() =>
                  navigate(ROUTES.ADMIN.CLIENT_EMAIL + `?to=${client.email}&name=${displayName}`)
                }
              >
                <Mail className="h-3.5 w-3.5" />
                Send Email
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 justify-start"
                onClick={() => { setProjectOpen(true); setProjectError(""); setProjectSuccess(false); }}
              >
                <Briefcase className="h-3.5 w-3.5" />
                Create Project
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full gap-2 justify-start">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                    Change Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {CLIENT_STATUSES.filter((s) => s !== displayStatus).map((s) => (
                    <DropdownMenuItem key={s}>
                      Mark as {s}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive">
                    Delete Client
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2 pt-5 px-5">
              <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Client Details
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <InfoRow label="Full Name"    value={displayName} />
              <InfoRow label="Company"      value={displayCompany} />
              <InfoRow label="Email"        value={client.email} />
              <InfoRow label="Phone"        value={client.phone} />
              <InfoRow label="Status"       value={displayStatus} />
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2 pt-5 px-5 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Recent Emails
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-muted-foreground"
                onClick={() =>
                  navigate(ROUTES.ADMIN.CLIENT_EMAIL + `?to=${client.email}&name=${displayName}`)
                }
              >
                <Mail className="h-3.5 w-3.5" />
                Compose
              </Button>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {threads.length === 0 ? (
                <p className="text-sm text-muted-foreground py-3 text-center">No emails yet.</p>
              ) : (
                <div className="space-y-2">
                  {threads.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => navigate(ROUTES.ADMIN.CLIENT_EMAIL)}
                      className="flex items-start gap-3 rounded-lg border border-border/50 px-3 py-2.5 cursor-pointer hover:bg-muted/20 transition-colors"
                    >
                      <Mail className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${!t.read ? "font-semibold" : "font-medium"}`}>
                          {t.subject}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{t.preview}</p>
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0">{t.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2 pt-5 px-5 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Projects ({projects.length})
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-muted-foreground"
                onClick={() => { setProjectOpen(true); setProjectError(""); setProjectSuccess(false); }}
              >
                <Briefcase className="h-3.5 w-3.5" />
                New
              </Button>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground py-3 text-center">No projects yet.</p>
              ) : (
                <div className="space-y-2">
                  {projects.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => navigate(ROUTES.ADMIN.PROJECT_DETAIL.replace(":projectId", p.id))}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-3 py-2.5 cursor-pointer hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Briefcase className="h-4 w-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{p.projectName || p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.status || "Planning"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {calls.length > 0 && (
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-2 pt-5 px-5">
                <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Call History
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-2">
                {calls.map((call) => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {call.direction === "inbound" ? (
                        <PhoneIncoming className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : (
                        <PhoneOutgoing className="h-4 w-4 text-primary shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{call.outcome}</p>
                        <p className="text-xs text-muted-foreground">
                          {call.date} · {call.time}{call.duration ? ` · ${call.duration}` : ""}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={
                        call.direction === "inbound"
                          ? "bg-emerald-500/15 text-emerald-700 border-none text-[10px] shrink-0"
                          : "bg-primary/10 text-primary border-none text-[10px] shrink-0"
                      }
                    >
                      {call.direction}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={projectOpen} onOpenChange={setProjectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Project for {displayName}</DialogTitle>
          </DialogHeader>
          {projectSuccess ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
              Project created successfully!
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Project Name <span className="text-destructive">*</span></Label>
                <Input
                  value={projectName}
                  onChange={(e) => { setProjectName(e.target.value); setProjectError(""); }}
                  placeholder="e.g. Office Renovation"
                  autoFocus
                />
              </div>
              {projectError && (
                <p className="text-xs text-destructive">{projectError}</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateProject} disabled={projectSaving || projectSuccess}>
              {projectSaving ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
