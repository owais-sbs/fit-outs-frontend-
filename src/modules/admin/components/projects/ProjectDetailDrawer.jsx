import { Building2, CalendarDays, DollarSign, FileText, MapPin, Phone, Mail, Users, Paperclip } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import ProjectStatusBadge from "./ProjectStatusBadge";
import PaymentStatusBadge from "./PaymentStatusBadge";

function formatCurrency(n) {
  return n ? `$${n.toLocaleString()}` : "\u2014";
}

function formatDate(d) {
  if (!d) return "\u2014";
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(d));
}

function DetailSection({ icon: Icon, title, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span>{title}</span>
      </div>
      <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-sm">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right">{value || "\u2014"}</span>
    </div>
  );
}

export default function ProjectDetailDrawer({ project, open, onOpenChange }) {
  if (!project) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{project.id}</span>
            <ProjectStatusBadge status={project.status} />
          </div>
          <SheetTitle className="text-xl">{project.projectName}</SheetTitle>
          <p className="text-sm text-muted-foreground">{project.clientName}</p>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-10rem)] pr-4">
          <div className="space-y-4 pb-8">
            {/* Client Information */}
            <DetailSection icon={Building2} title="Client Information">
              <InfoRow label="Client" value={project.clientName} />
              <InfoRow label="Company" value={project.company} />
              {project.clientEmail && (
                <div className="flex items-center gap-2 py-1">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm">{project.clientEmail}</span>
                </div>
              )}
              {project.clientPhone && (
                <div className="flex items-center gap-2 py-1">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm">{project.clientPhone}</span>
                </div>
              )}
            </DetailSection>

            {/* Project Overview */}
            <DetailSection icon={MapPin} title="Project Overview">
              <InfoRow label="Project Type" value={project.projectType} />
              <InfoRow label="Location" value={project.location} />
              <InfoRow label="Start Date" value={formatDate(project.startDate)} />
              <InfoRow label="Expected Completion" value={formatDate(project.expectedCompletion)} />
              {project.actualCompletion && (
                <InfoRow label="Actual Completion" value={formatDate(project.actualCompletion)} />
              )}
              {project.description && (
                <p className="mt-2 text-sm text-muted-foreground">{project.description}</p>
              )}
            </DetailSection>

            {/* Assigned Team */}
            <DetailSection icon={Users} title="Assigned Team">
              {project.team.map((member, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <span className="font-medium">{member.name}</span>
                  <span className="text-sm text-muted-foreground">{member.role}</span>
                </div>
              ))}
            </DetailSection>

            {/* Payment Summary */}
            <DetailSection icon={DollarSign} title="Payment Summary">
              <div className="space-y-2">
                <InfoRow label="Total Amount" value={formatCurrency(project.paymentSummary.total)} />
                <InfoRow label="Paid" value={formatCurrency(project.paymentSummary.paid)} />
                <InfoRow label="Pending" value={formatCurrency(project.paymentSummary.pending)} />
                <InfoRow label="Status" value={<PaymentStatusBadge status={project.paymentStatus} />} />
                {project.paymentSummary.dueDate && (
                  <InfoRow label="Next Due" value={formatDate(project.paymentSummary.dueDate)} />
                )}
              </div>
            </DetailSection>

            {/* Proposal Summary */}
            <DetailSection icon={FileText} title="Proposal Summary">
              <InfoRow label="Amount" value={formatCurrency(project.proposalSummary.amount)} />
              <InfoRow label="Status" value={project.proposalSummary.status} />
              <InfoRow label="Approved" value={formatDate(project.proposalSummary.date)} />
            </DetailSection>

            {/* Timeline Activity */}
            <DetailSection icon={CalendarDays} title="Timeline Activity">
              {project.timeline.map((entry, i) => (
                <div key={i} className="flex items-start gap-3 py-1.5">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary/40" />
                  <div className="flex-1">
                    <p className="text-sm">{entry.event}</p>
                    <p className="text-[11px] text-muted-foreground">{formatDate(entry.date)}</p>
                  </div>
                </div>
              ))}
            </DetailSection>

            {/* Site Visit History */}
            {project.siteVisits.length > 0 && (
              <DetailSection icon={MapPin} title="Site Visit History">
                {project.siteVisits.map((visit, i) => (
                  <div key={i} className="space-y-1 py-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{visit.staff}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(visit.date)}</span>
                    </div>
                    {visit.notes && <p className="text-sm text-muted-foreground">{visit.notes}</p>}
                    {i < project.siteVisits.length - 1 && <Separator className="mt-2" />}
                  </div>
                ))}
              </DetailSection>
            )}

            {/* Notes & Attachments */}
            <DetailSection icon={Paperclip} title="Notes & Attachments">
              {project.notes && (
                <div className="mb-3">
                  <p className="text-sm text-muted-foreground">{project.notes}</p>
                </div>
              )}
              {project.attachments.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Attachments
                  </p>
                  {project.attachments.map((att, i) => (
                    <div key={i} className="flex items-center justify-between rounded-md border border-border/40 px-3 py-2">
                      <span className="text-sm">{att.name}</span>
                      <span className="text-xs text-muted-foreground">{att.size}</span>
                    </div>
                  ))}
                </div>
              )}
            </DetailSection>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
