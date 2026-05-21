import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Clock3, MapPin, Navigation2, ShieldCheck, Sparkles } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { CHECKLIST_TEMPLATES } from "../data/site-visits";
import { INITIAL_LEADS } from "../data/leads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ALL_LEADS = Object.values(INITIAL_LEADS).flat();
const STAFF_MEMBERS = ["Tom Bradley", "James Wu", "Emma Walsh", "Lisa Park"];
const QUICK_DATES = [
  { label: "Today", value: "2026-05-22" },
  { label: "Tomorrow", value: "2026-05-23" },
  { label: "Next week", value: "2026-05-29" },
];
const QUICK_TIMES = ["08:30", "10:00", "13:30", "15:00"];

export default function SiteVisitSchedulePage() {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [form, setForm] = useState({
    leadId: "",
    staff: "",
    date: "",
    time: "",
    location: "",
    checklist: "",
    notes: "",
  });

  const selectedLead = ALL_LEADS.find((l) => l.id === form.leadId);

  const summaryItems = useMemo(
    () => [
      {
        label: "Lead",
        value: selectedLead ? `${selectedLead.clientName} - ${selectedLead.company}` : "Select a lead",
      },
      { label: "Date", value: form.date || "Pending" },
      { label: "Time", value: form.time || "Pending" },
      { label: "Staff", value: form.staff || "Assign staff" },
      { label: "Checklist", value: form.checklist || "Select template" },
    ],
    [form.checklist, form.date, form.staff, form.time, selectedLead]
  );

  return (
    <div className="space-y-6 pb-28">
      <PageHeader
        title="Schedule site visit"
        description="Book an on-site inspection with a clear lead, staff assignment, location pin, and checklist workflow."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">Visit details</CardTitle>
                <CardDescription>Select lead, time, staff, location, and checklist template.</CardDescription>
              </div>
              <Badge variant="outline" className="gap-1">
                <Sparkles className="h-3 w-3" />
                Draft schedule
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Lead *</Label>
                <Select value={form.leadId} onValueChange={(v) => setForm((f) => ({ ...f, leadId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_LEADS.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.clientName} - {lead.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date *</Label>
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Quick pick
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_DATES.map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={form.date === option.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setForm((f) => ({ ...f, date: option.value }))}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Time *</Label>
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    Suggested slots
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_TIMES.map((time) => (
                      <Button
                        key={time}
                        type="button"
                        variant={form.time === time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setForm((f) => ({ ...f, time }))}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
                <Input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Assigned staff *</Label>
                <Select value={form.staff} onValueChange={(v) => setForm((f) => ({ ...f, staff: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {STAFF_MEMBERS.map((member) => (
                      <SelectItem key={member} value={member}>
                        {member}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Checklist template *</Label>
                <Select
                  value={form.checklist}
                  onValueChange={(v) => setForm((f) => ({ ...f, checklist: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Template" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHECKLIST_TEMPLATES.map((template) => (
                      <SelectItem key={template} value={template}>
                        {template}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Location *</Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="Street address or site name"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={4}
                  placeholder="Site access notes, parking instructions, and client preferences..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="sticky top-6 border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Navigation2 className="h-4 w-4 text-primary" />
                Location pin
              </CardTitle>
              <CardDescription>Mock map area for confirming the inspection location.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-muted/30 via-card to-muted/50 p-4">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,0,0,0.04),transparent_32%),radial-gradient(circle_at_80%_30%,rgba(0,0,0,0.03),transparent_28%),radial-gradient(circle_at_50%_80%,rgba(0,0,0,0.04),transparent_28%)]" />
                <div className="relative flex h-56 items-center justify-center">
                  <div className="grid h-full w-full grid-cols-3 grid-rows-3 gap-2">
                    {Array.from({ length: 9 }).map((_, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-dashed border-border/40 bg-background/30"
                      />
                    ))}
                  </div>
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="flex flex-col items-center">
                      <MapPin className="h-10 w-10 text-primary drop-shadow" />
                      <div className="mt-2 rounded-full border border-primary/20 bg-background px-3 py-1 text-xs font-medium shadow-sm">
                        {form.location || "Drop pin here"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Schedule summary</CardTitle>
              <CardDescription>Live preview of the field visit setup.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {summaryItems.map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="max-w-[60%] text-right font-medium text-foreground">{item.value}</span>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="rounded-lg border border-primary/15 bg-primary/5 p-3 text-xs text-muted-foreground">
                Choose a lead and checklist template to keep the inspection workflow consistent across every visit.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/95 p-4 backdrop-blur md:left-[var(--sidebar-width)]">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="outline" asChild>
            <Link to={ROUTES.CRM.SITE_VISITS}>Cancel</Link>
          </Button>
          <Button onClick={() => setConfirmOpen(true)} className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Confirm schedule
          </Button>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Visit scheduled</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              {selectedLead?.clientName || "Lead"} - {selectedLead?.company || "Company"}
            </p>
            <p>
              {form.date || "Date pending"} at {form.time || "Time pending"}
            </p>
            <p>
              Assigned to {form.staff || "staff"} with {form.checklist || "no checklist selected"}.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Keep editing
            </Button>
            <Button onClick={() => navigate(ROUTES.CRM.SITE_VISITS)}>View visits</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
