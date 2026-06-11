import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, Calendar, MessageSquare, MapPin, Phone, Mail,
  Building2, DollarSign, Clock, Paperclip, FileText,
  CheckCircle2, Circle, Edit, Zap, CalendarPlus, User,
} from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import { getLeadById as getMockLeadById, LEAD_DETAIL_EXTRA, PIPELINE_COLUMNS } from "../data/leads";
import { normalizeLead } from "../api/leads.api";
import axiosInstance from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─── Priority config ──────────────────────────────────────────────────────────
const PRIORITY_VARIANT = {
  high: "destructive", High: "destructive",
  medium: "warning",   Medium: "warning",
  low: "secondary",    Low: "secondary",
};

// ─── Timeline event icon ──────────────────────────────────────────────────────
function TimelineIcon({ type }) {
  const base = "flex h-7 w-7 items-center justify-center rounded-full border-2 border-background ring-1";
  const map = {
    call:       { cls: "bg-blue-100 ring-blue-200 dark:bg-blue-900/40 dark:ring-blue-800", Icon: Phone },
    site_visit: { cls: "bg-amber-100 ring-amber-200 dark:bg-amber-900/40 dark:ring-amber-800", Icon: MapPin },
    status:     { cls: "bg-emerald-100 ring-emerald-200 dark:bg-emerald-900/40 dark:ring-emerald-800", Icon: Zap },
    contact:    { cls: "bg-violet-100 ring-violet-200 dark:bg-violet-900/40 dark:ring-violet-800", Icon: User },
  };
  const { cls, Icon } = map[type] || map.contact;
  return (
    <div className={cn(base, cls)}>
      <Icon className="h-3.5 w-3.5 text-foreground/70" />
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// ─── Sidebar info row ─────────────────────────────────────────────────────────
function SidebarRow({ label, value, icon: Icon }) {
  if (!value || value === "—") return null;
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
        <p className="text-sm font-medium break-all">{value}</p>
      </div>
    </div>
  );
}

export default function LeadDetailPage() {
  const { leadId } = useParams();
  const [apiLead, setApiLead] = useState(null);
  const [loadingLead, setLoadingLead] = useState(true);
  const lead = apiLead || getMockLeadById(leadId);
  const extra = LEAD_DETAIL_EXTRA[leadId] || {
    timeline: [], notes: [], followUps: [], siteVisit: null, attachments: [], activities: [],
  };

  const [status, setStatus] = useState(lead?.stage || "new");
  const [noteOpen, setNoteOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState(extra.notes);

  useEffect(() => {
    let cancelled = false;
    setLoadingLead(true);
    axiosInstance.get(`/leads/${leadId}`)
      .then(({ data }) => {
        if (!cancelled && data?.data) setApiLead(normalizeLead(data.data));
      })
      .catch(() => {
        if (!cancelled) setApiLead(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingLead(false);
      });
    return () => { cancelled = true; };
  }, [leadId]);

  useEffect(() => {
    if (lead?.stage) setStatus(lead.stage);
  }, [lead?.stage]);

  if (!lead && loadingLead) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={ROUTES.ADMIN.LEADS_LIST}><ArrowLeft className="mr-2 h-4 w-4" />Pipeline</Link>
        </Button>
        <Card><CardContent className="py-16 text-center text-muted-foreground">Loading lead...</CardContent></Card>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={ROUTES.ADMIN.LEADS_LIST}><ArrowLeft className="mr-2 h-4 w-4" />Pipeline</Link>
        </Button>
        <Card><CardContent className="py-16 text-center text-muted-foreground">Lead not found.</CardContent></Card>
      </div>
    );
  }

  const initials = lead.assignee?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "??";

  return (
    <div className="space-y-5">
      {/* ── Back ─────────────────────────────────────────────────────────── */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to={ROUTES.ADMIN.LEADS_LIST}><ArrowLeft className="mr-2 h-4 w-4" />Pipeline</Link>
      </Button>

      {/* ── Hero header ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 text-lg">
            <AvatarFallback className="bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h1 className="text-xl font-bold">{lead.clientName}</h1>
            <p className="text-sm text-muted-foreground">{lead.company}</p>
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <Badge variant="outline" className="capitalize">{status}</Badge>
              <Badge variant={PRIORITY_VARIANT[lead.priority] || "secondary"} className="capitalize">
                {lead.priority}
              </Badge>
              {lead.projectType && <Badge variant="outline">{lead.projectType}</Badge>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Edit className="h-3.5 w-3.5" />Edit
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setNoteOpen(true)}>
            <MessageSquare className="h-3.5 w-3.5" />Add note
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setFollowUpOpen(true)}>
            <Calendar className="h-3.5 w-3.5" />Log follow-up
          </Button>
          <Button size="sm" className="gap-1.5" asChild>
            <Link to={ROUTES.ADMIN.SITE_VISIT_SCHEDULE}>
              <CalendarPlus className="h-3.5 w-3.5" />Schedule visit
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Main 2-col layout ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-5 lg:flex-row">
        {/* ── Tabs main ───────────────────────────────────────────────────── */}
        <div className="min-w-0 flex-1">
          <Tabs defaultValue="overview">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="notes">
                Notes {notes.length > 0 && <span className="ml-1 text-[10px] text-muted-foreground">({notes.length})</span>}
              </TabsTrigger>
              <TabsTrigger value="followups">
                Follow-ups {extra.followUps.length > 0 && <span className="ml-1 text-[10px] text-muted-foreground">({extra.followUps.length})</span>}
              </TabsTrigger>
              <TabsTrigger value="visit">Site visit</TabsTrigger>
              <TabsTrigger value="attachments">
                Attachments {extra.attachments.length > 0 && <span className="ml-1 text-[10px] text-muted-foreground">({extra.attachments.length})</span>}
              </TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            {/* OVERVIEW */}
            <TabsContent value="overview" className="mt-4 space-y-4">
              <Card className="border-border/60">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Project details</CardTitle></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Budget</p>
                    <p className="text-lg font-bold text-primary">${lead.budget?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Project type</p>
                    <p className="font-medium">{lead.projectType || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Source</p>
                    <p className="font-medium">{lead.source}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Expected start</p>
                    <p className="font-medium">{lead.expectedStart || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Location</p>
                    <p className="font-medium">{lead.location || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Follow-up date</p>
                    <p className="font-medium">{lead.followUp}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Contact</CardTitle></CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p>{lead.phone || "—"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="truncate">{lead.email || "—"}</p>
                  </div>
                </CardContent>
              </Card>

              {lead.notes && (
                <Card className="border-border/60">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{lead.notes}</CardContent>
                </Card>
              )}
            </TabsContent>

            {/* TIMELINE */}
            <TabsContent value="timeline" className="mt-4">
              <Card className="border-border/60">
                <CardContent className="pt-6">
                  {extra.timeline.length === 0 ? (
                    <EmptyState icon={Clock} message="No timeline events yet." />
                  ) : (
                    <div className="relative space-y-6 pl-4 before:absolute before:left-[13px] before:top-0 before:h-full before:w-px before:bg-border">
                      {extra.timeline.map((ev, i) => (
                        <div key={i} className="flex gap-3">
                          <TimelineIcon type={ev.type} />
                          <div className="flex-1 pt-0.5">
                            <p className="text-sm font-medium">{ev.title}</p>
                            {ev.description && <p className="text-xs text-muted-foreground mt-0.5">{ev.description}</p>}
                            <p className="text-xs text-muted-foreground mt-1">{ev.time} · {ev.user}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* NOTES */}
            <TabsContent value="notes" className="mt-4 space-y-3">
              {notes.length === 0 ? (
                <Card className="border-border/60">
                  <CardContent><EmptyState icon={MessageSquare} message="No notes yet. Add the first one." /></CardContent>
                </Card>
              ) : (
                notes.map((n) => (
                  <Card key={n.id} className="border-border/60">
                    <CardContent className="pt-4 text-sm">
                      <p>{n.text}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{n.author} · {n.time}</p>
                    </CardContent>
                  </Card>
                ))
              )}
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setNoteOpen(true)}>
                <MessageSquare className="h-4 w-4" />Add note
              </Button>
            </TabsContent>

            {/* FOLLOW-UPS */}
            <TabsContent value="followups" className="mt-4">
              <Card className="border-border/60">
                <CardContent className="pt-4">
                  {extra.followUps.length === 0 ? (
                    <EmptyState icon={Calendar} message="No follow-ups logged yet." />
                  ) : (
                    <div className="divide-y divide-border/50">
                      {extra.followUps.map((f) => (
                        <div key={f.id} className="flex items-start gap-3 py-3">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <div>
                            <p className="text-sm font-medium">{f.outcome}</p>
                            <p className="text-xs text-muted-foreground">{f.date} · {f.user}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => setFollowUpOpen(true)}>
                <Calendar className="h-4 w-4" />Log follow-up
              </Button>
            </TabsContent>

            {/* SITE VISIT */}
            <TabsContent value="visit" className="mt-4">
              {extra.siteVisit ? (
                <Card className="border-border/60">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Scheduled visit</CardTitle></CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Date</p>
                          <p className="font-medium">{extra.siteVisit.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Duration</p>
                          <p className="font-medium">{extra.siteVisit.duration || "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:col-span-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Location</p>
                          <p className="font-medium">{extra.siteVisit.location}</p>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Staff</p>
                        <p className="font-medium">{extra.siteVisit.staff}</p>
                      </div>
                      <Badge variant="outline" className="capitalize">{extra.siteVisit.status}</Badge>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={ROUTES.ADMIN.SITE_VISIT_REPORT.replace(":visitId", "v1")}>
                        <FileText className="mr-2 h-3.5 w-3.5" />View report form
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-border/60">
                  <CardContent>
                    <EmptyState icon={MapPin} message="No site visit scheduled." />
                    <div className="flex justify-center">
                      <Button size="sm" asChild>
                        <Link to={ROUTES.ADMIN.SITE_VISIT_SCHEDULE}>Schedule a visit</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ATTACHMENTS */}
            <TabsContent value="attachments" className="mt-4">
              <Card className="border-border/60">
                <CardContent className="pt-4">
                  {extra.attachments.length === 0 ? (
                    <EmptyState icon={Paperclip} message="No attachments uploaded yet." />
                  ) : (
                    <div className="divide-y divide-border/50">
                      {extra.attachments.map((a) => (
                        <div key={a.id} className="flex items-center gap-3 py-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium">{a.name}</p>
                            <p className="text-xs text-muted-foreground">{a.size} · {a.date}</p>
                          </div>
                          <Button variant="ghost" size="sm">Download</Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ACTIVITY */}
            <TabsContent value="activity" className="mt-4">
              <Card className="border-border/60">
                <CardContent className="divide-y pt-2">
                  {extra.activities.length === 0 ? (
                    <EmptyState icon={Clock} message="No activity recorded." />
                  ) : (
                    extra.activities.map((a, i) => (
                      <div key={i} className="flex items-center justify-between py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Circle className="h-1.5 w-1.5 fill-primary text-primary" />
                          <span>{a.action}</span>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{a.time}</span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Right sidebar ────────────────────────────────────────────────── */}
        <aside className="w-full lg:w-60 xl:w-64">
          <div className="space-y-4 lg:sticky lg:top-4">
            {/* Actions card */}
            <Card className="border-border/60">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Move stage</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PIPELINE_COLUMNS.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Lead info sidebar */}
            <Card className="border-border/60">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Lead info</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-xs text-primary font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{lead.assignee}</p>
                    <p className="text-xs text-muted-foreground">Sales rep</p>
                  </div>
                </div>
                <Separator />
                <SidebarRow label="Source"   value={lead.source}       icon={Building2} />
                <SidebarRow label="Budget"   value={`$${lead.budget?.toLocaleString()}`} icon={DollarSign} />
                <SidebarRow label="Priority" value={lead.priority}     />
                <SidebarRow label="Location" value={lead.location}     icon={MapPin} />
                <SidebarRow label="Phone"    value={lead.phone}        icon={Phone} />
                <SidebarRow label="Email"    value={lead.email}        icon={Mail} />
                <SidebarRow label="Follow-up" value={lead.followUp}   icon={Calendar} />
                <SidebarRow label="Expected start" value={lead.expectedStart} icon={Calendar} />
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>

      {/* ── Add note dialog ──────────────────────────────────────────────── */}
      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add note</DialogTitle></DialogHeader>
          <Textarea
            placeholder="Enter your note…"
            rows={4}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (noteText.trim()) {
                setNotes((n) => [...n, { id: `n${Date.now()}`, author: "You", text: noteText.trim(), time: "Just now" }]);
                setNoteText("");
              }
              setNoteOpen(false);
            }}>Save note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Log follow-up dialog ─────────────────────────────────────────── */}
      <Dialog open={followUpOpen} onOpenChange={setFollowUpOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log follow-up</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Date</p>
              <Input type="date" />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Outcome / notes</p>
              <Textarea placeholder="What happened on this follow-up?" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFollowUpOpen(false)}>Cancel</Button>
            <Button onClick={() => setFollowUpOpen(false)}>Save follow-up</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
