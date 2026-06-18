import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, Calendar, MessageSquare, Phone, Mail,
  Building2, Clock, UserCheck,
} from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import { fetchLeadById, updateLeadStatus, convertLeadToClient,
  createLeadAccount } from "../api/leads.api";
import { useAuth } from "@/shared/context/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";


const STATUS_VARIANT = {
  NEW: "default",
  CONTACTED: "outline",
  QUALIFIED: "warning",
  SITE_VISIT_SCHEDULED: "secondary",
  LOST: "destructive",
  FOLLOWUP: "primary"

};

const STATUS_LABELS = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  SITE_VISIT_SCHEDULED: "Site Visit Scheduled",
  LOST: "Lost",
  FOLLOWUP: "Followup",

};

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

function SidebarRow({ label, value, icon: Icon, href }) {
  if (!value || value === "\u2014") return null;
  const content = (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
        <p className={`text-sm font-medium break-all ${href ? "text-primary hover:underline cursor-pointer" : ""}`}>{value}</p>
      </div>
    </div>
  );
  if (href) {
    return <a href={href} target="_blank" rel="noopener noreferrer">{content}</a>;
  }
  return content;
}

export default function LeadDetailPage() {
  const { leadId } = useParams();
  const { user } = useAuth();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusSaving, setStatusSaving] = useState(false);

  const [status, setStatus] = useState("NEW");
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [convertOpen, setConvertOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchLeadById(leadId)
      .then((data) => {
        if (cancelled) return;
        setLead(data);
        setStatus(data.status || "NEW");
      })
      .catch(() => {
        if (cancelled) return;
        setLead(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [leadId]);

  const handleStatusChange = async (newStatus) => {
    if (newStatus === status) return;
    setStatusSaving(true);
    try {
      const updated = await updateLeadStatus(leadId, newStatus, user?.id);
      setLead(updated);
      setStatus(updated.status);
    } catch (err) {
      console.error("Failed to update status:", err);
      setStatus(lead.status);
    } finally {
      setStatusSaving(false);
    }
  };

  const handleConvertToClient = async () => {
    setConverting(true);
    try {
      const updated = await convertLeadToClient(leadId);
      setLead(updated);
      setStatus(updated.status);
      setConvertOpen(false);
    } catch (err) {
      console.error("Failed to convert lead:", err);
    } finally {
      setConverting(false);
    }
  };

  const handleCreateAccount = async () => {
  setCreatingAccount(true);

  try {
    await createLeadAccount(leadId);

    setLead((prev) => ({
      ...prev,
      accountCreated: true,
    }));
  } catch (err) {
    console.error("Failed to create account:", err);
  } finally {
    setCreatingAccount(false);
  }
};

  if (loading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={ROUTES.ADMIN.LEADS_LIST}><ArrowLeft className="mr-2 h-4 w-4" />Leads</Link>
        </Button>
        <Card><CardContent className="py-16 text-center text-muted-foreground">Loading lead...</CardContent></Card>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={ROUTES.ADMIN.LEADS_LIST}><ArrowLeft className="mr-2 h-4 w-4" />Leads</Link>
        </Button>
        <Card><CardContent className="py-16 text-center text-muted-foreground">Lead not found.</CardContent></Card>
      </div>
    );
  }

  const initials = lead.clientName?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "??";
  const phoneHref = lead.phone ? `tel:${lead.phone.replace(/\s/g, "")}` : null;
  const emailHref = lead.email ? `https://mail.google.com/mail/?to=${encodeURIComponent(lead.email)}` : null;

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to={ROUTES.ADMIN.LEADS_LIST}><ArrowLeft className="mr-2 h-4 w-4" />Leads</Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 text-lg">
            <AvatarFallback className="bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h1 className="text-xl font-bold">{lead.clientName}</h1>
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <Badge variant={STATUS_VARIANT[status] || "secondary"} className="capitalize">
                {STATUS_LABELS[status] || status}
              </Badge>
              {lead.projectType && <Badge variant="outline">{lead.projectType}</Badge>}
              {lead.referenceNo && (
                <span className="ml-1 font-mono text-[11px] text-muted-foreground">
                  #{lead.referenceNo}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setNoteOpen(true)}>
            <MessageSquare className="h-3.5 w-3.5" />Add note
          </Button>
          <Button size="sm" className="gap-1.5" asChild>
            <Link to={ROUTES.ADMIN.SITE_VISIT_SCHEDULE}>
              <Calendar className="h-3.5 w-3.5" />Schedule visit
            </Link>
          </Button>
          {status !== "CLIENT" && status !== "LOST" && (
            <Button
              variant="default"
              size="sm"
              className="gap-1.5 bg-green-600 hover:bg-green-700"
              onClick={() => setConvertOpen(true)}
            >
              <UserCheck className="h-3.5 w-3.5" />Convert to Client
            </Button>
          )}
          {!lead.accountCreated && (
  <Button
    variant="outline"
    size="sm"
    disabled={creatingAccount}
    onClick={handleCreateAccount}
  >
    {creatingAccount ? "Creating..." : "Create Account"}
  </Button>
)}


        </div>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="min-w-0 flex-1">
          <Tabs defaultValue="overview">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              <Card className="border-border/60">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Project details</CardTitle></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Project type</p>
                    <p className="font-medium">{lead.projectType || "\u2014"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Source</p>
                    <p className="font-medium">{lead.source}</p>
                  </div>
                  {lead.otherSource && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Other source</p>
                      <p className="font-medium">{lead.otherSource}</p>
                    </div>
                  )}
                  {lead.referenceNo && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Reference No.</p>
                      <p className="font-medium font-mono">{lead.referenceNo}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Contact</CardTitle></CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
                  <a href={phoneHref} className="flex items-center gap-2 hover:text-primary transition-colors">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className={phoneHref ? "cursor-pointer" : ""}>{lead.phone || "\u2014"}</p>
                  </a>
                  <a href={emailHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className={`truncate ${emailHref ? "cursor-pointer" : ""}`}>{lead.email || "\u2014"}</p>
                  </a>
                </CardContent>
              </Card>

              {lead.notes && (
                <Card className="border-border/60">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
                  <CardContent className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.notes}</CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="notes" className="mt-4 space-y-3">
              <Card className="border-border/60">
                {lead.notes ? (
                  <CardContent className="pt-4 text-sm">
                    <p className="whitespace-pre-wrap">{lead.notes}</p>
                  </CardContent>
                ) : (
                  <CardContent>
                    <EmptyState icon={MessageSquare} message="No notes attached to this lead." />
                  </CardContent>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="w-full lg:w-60 xl:w-64">
          <div className="space-y-4 lg:sticky lg:top-4">
            <Card className="border-border/60">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Move status</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Select value={status} onValueChange={handleStatusChange} disabled={statusSaving}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {statusSaving && <p className="text-[11px] text-muted-foreground">Saving...</p>}
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Lead info</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <SidebarRow label="Source" value={lead.source} icon={Building2} />
                <SidebarRow label="Phone" value={lead.phone} icon={Phone} href={phoneHref} />
                <SidebarRow label="Email" value={lead.email} icon={Mail} href={emailHref} />
                {lead.createdAt && (
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Created</p>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <p className="text-sm font-medium">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>

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
            <Button
              disabled={!noteText.trim()}
              onClick={() => {
                setNoteOpen(false);
                setNoteText("");
              }}
            >
              Save note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Client</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will create a client account for <span className="font-medium text-foreground">{lead.email}</span> with password <span className="font-mono font-medium text-foreground">123456</span> and move this lead to Client status.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertOpen(false)} disabled={converting}>Cancel</Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              disabled={converting}
              onClick={handleConvertToClient}
            >
              {converting ? "Converting..." : "Convert"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
