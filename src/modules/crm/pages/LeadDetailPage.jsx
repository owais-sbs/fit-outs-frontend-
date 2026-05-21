import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, MessageSquare, MapPin } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import { getLeadById, LEAD_DETAIL_EXTRA } from "../data/leads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function LeadDetailPage() {
  const { leadId } = useParams();
  const lead = getLeadById(leadId);
  const extra = LEAD_DETAIL_EXTRA[leadId] || { timeline: [], notes: [], siteVisit: null, activities: [] };
  const [status, setStatus] = useState(lead?.stage || "new");
  const [noteOpen, setNoteOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);

  if (!lead) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild><Link to={ROUTES.CRM.PIPELINE}><ArrowLeft className="mr-2 h-4 w-4" />Pipeline</Link></Button>
        <Card><CardContent className="py-12 text-center">Lead not found</CardContent></Card>
      </div>
    );
  }

  const initials = lead.assignee.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to={ROUTES.CRM.PIPELINE}><ArrowLeft className="mr-2 h-4 w-4" />Pipeline</Link>
      </Button>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{lead.clientName}</h1>
              <p className="text-muted-foreground">{lead.company}</p>
            </div>
            <Badge variant="outline" className="capitalize">{status}</Badge>
          </div>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="timeline">Follow-up</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="visit">Site visit</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card className="border-border/60">
                <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 text-sm">
                  <div><span className="text-muted-foreground">Budget</span><p className="font-medium">${lead.budget.toLocaleString()}</p></div>
                  <div><span className="text-muted-foreground">Source</span><p className="font-medium">{lead.source}</p></div>
                  <div><span className="text-muted-foreground">Priority</span><p className="font-medium capitalize">{lead.priority}</p></div>
                  <div><span className="text-muted-foreground">Follow-up</span><p className="font-medium">{lead.followUp}</p></div>
                </CardContent>
              </Card>
              <Card className="border-border/60">
                <CardHeader><CardTitle className="text-base">Assigned user</CardTitle></CardHeader>
                <CardContent className="flex items-center gap-3">
                  <Avatar><AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback></Avatar>
                  <div><p className="font-medium">{lead.assignee}</p><p className="text-xs text-muted-foreground">Sales rep</p></div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline">
              <Card className="border-border/60">
                <CardContent className="space-y-4 pt-6">
                  {extra.timeline.map((ev, i) => (
                    <div key={i} className="border-l-2 border-primary/30 pl-4">
                      <p className="font-medium text-sm">{ev.title}</p>
                      <p className="text-xs text-muted-foreground">{ev.time} · {ev.user}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              {extra.notes.map((n, i) => (
                <Card key={i} className="border-border/60">
                  <CardContent className="pt-4 text-sm">
                    <p>{n.text}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{n.author} · {n.time}</p>
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" className="gap-2" onClick={() => setNoteOpen(true)}>
                <MessageSquare className="h-4 w-4" />Add note
              </Button>
            </TabsContent>

            <TabsContent value="visit">
              {extra.siteVisit ? (
                <Card className="border-border/60">
                  <CardContent className="space-y-2 pt-6 text-sm">
                    <p className="flex items-center gap-2"><Calendar className="h-4 w-4" />{extra.siteVisit.date}</p>
                    <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{extra.siteVisit.location}</p>
                    <p>Staff: {extra.siteVisit.staff}</p>
                    <Badge>{extra.siteVisit.status}</Badge>
                    <Button asChild className="mt-2" variant="outline" size="sm">
                      <Link to={ROUTES.CRM.SITE_VISIT_REPORT.replace(":visitId", "v1")}>View report form</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <p className="text-sm text-muted-foreground">No site visit scheduled.</p>
              )}
            </TabsContent>

            <TabsContent value="activity">
              <Card className="border-border/60">
                <CardContent className="divide-y pt-2">
                  {extra.activities.map((a, i) => (
                    <div key={i} className="flex justify-between py-3 text-sm">
                      <span>{a.action}</span>
                      <span className="text-muted-foreground">{a.time}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="w-full lg:w-64">
          <Card className="sticky top-20 border-border/60">
            <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["new", "contacted", "qualified", "siteVisit", "won", "lost"].map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="w-full gap-2" variant="outline" onClick={() => setFollowUpOpen(true)}>
                <Calendar className="h-4 w-4" />Log follow-up
              </Button>
              <Button className="w-full" asChild>
                <Link to={ROUTES.CRM.SITE_VISIT_SCHEDULE}>Request site visit</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add note</DialogTitle></DialogHeader>
          <Textarea placeholder="Enter note..." rows={4} />
          <DialogFooter>
            <Button onClick={() => setNoteOpen(false)}>Save note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={followUpOpen} onOpenChange={setFollowUpOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log follow-up</DialogTitle></DialogHeader>
          <Input type="date" className="mt-2" />
          <Textarea placeholder="Outcome..." className="mt-2" rows={3} />
          <DialogFooter>
            <Button onClick={() => setFollowUpOpen(false)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
