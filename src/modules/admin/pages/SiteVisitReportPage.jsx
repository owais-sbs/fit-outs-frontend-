import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  CalendarClock,
  Check,
  ClipboardList,
  Clock3,
  IndianRupee,
  ImagePlus,
  LockKeyhole,
  Mail,
  MapPin,
  Navigation2,
  Paperclip,
  Phone,
  User,
} from "lucide-react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { ROUTES } from "@/shared/constants/routes";
import { REPORT_CHECKLIST } from "../data/site-visits";
import axiosInstance from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const INITIAL_NOTES =
  "Ceiling grid is suitable for LED panels. Client requested premium finish in reception and a clear path for cable runs.";

const MOCK_PHOTOS = ["Reception", "Services", "Floor plan"];

function fallbackChecklistItems() {
  return REPORT_CHECKLIST.map((item) => ({
    id: item.id,
    label: item.label,
    required: item.required,
  }));
}

function normalizeTemplateItem(item) {
  return {
    id: String(item.uuid),
    label: item.question || item.sectionName || "Checklist item",
    required: Boolean(item.isRequired),
    sectionName: item.sectionName || "",
  };
}

function fullAddress(locationDetails = {}) {
  const parts = [
    locationDetails.addressLine1,
    locationDetails.addressLine2,
    locationDetails.buildingName,
    locationDetails.floor && `Floor ${locationDetails.floor}`,
    locationDetails.unitNumber && `Unit ${locationDetails.unitNumber}`,
    locationDetails.landmark,
    locationDetails.area,
    locationDetails.city,
    locationDetails.state,
    locationDetails.pincode,
    locationDetails.country,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Location not specified";
}

function formatScheduledDateTime(date, time) {
  if (!date) return "Not scheduled";
  try {
    const iso = time ? `${date}T${time}` : date;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return `${date}${time ? ` at ${time}` : ""}`;
    return new Intl.DateTimeFormat("en-AU", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return `${date}${time ? ` at ${time}` : ""}`;
  }
}

function formatTime(time) {
  if (!time) return "—";
  const [hours, minutes] = String(time).split(":");
  const h = Number(hours);
  if (!Number.isFinite(h)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:${minutes || "00"} ${period}`;
}

function formatBudget(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function statusBadgeVariant(status = "") {
  const s = String(status).toUpperCase();
  if (s === "COMPLETED") return "success";
  if (s === "CANCELLED") return "destructive";
  if (s === "IN_PROGRESS") return "default";
  return "warning";
}

function statusLabel(status = "") {
  if (!status) return "Pending";
  return String(status)
    .toLowerCase()
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export default function SiteVisitReportPage() {
  const { visitId } = useParams();
  const [submitted, setSubmitted] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [visit, setVisit] = useState(null);
  const [lead, setLead] = useState(null);
  const [template, setTemplate] = useState(null);
  const [checklistItems, setChecklistItems] = useState(fallbackChecklistItems);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [conversion, setConversion] = useState(null);
  const [checks, setChecks] = useState(() =>
    Object.fromEntries(fallbackChecklistItems().map((item) => [item.id, false]))
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    axiosInstance.get(`/site-visits/GetSiteVisitByUuid/${visitId}`)
      .then(async ({ data }) => {
        if (cancelled) return;
        const visitData = data?.data;
        setVisit(visitData);
        const completed = String(visitData?.status || "").toUpperCase() === "COMPLETED";
        setSubmitted(completed);
        setNotes(visitData?.notes || (completed ? INITIAL_NOTES : ""));

        const [templateResult, leadResult] = await Promise.allSettled([
          visitData?.checklistTemplateUuid
            ? axiosInstance.get(`/checklist-templates/GetCheckListByUuid/${visitData.checklistTemplateUuid}`)
            : Promise.resolve({ data: { data: null } }),
          visitData?.leadId
            ? axiosInstance.get(`/leads/${visitData.leadId}`)
            : Promise.resolve({ data: { data: null } }),
        ]);

        if (cancelled) return;
        const templateData = templateResult.status === "fulfilled" ? templateResult.value.data?.data : null;
        setTemplate(templateData);
        const templateItems = Array.isArray(templateData?.items) && templateData.items.length > 0
          ? templateData.items.map(normalizeTemplateItem)
          : fallbackChecklistItems();
        setChecklistItems(templateItems);
        setChecks(Object.fromEntries(templateItems.map((item) => [item.id, completed])));

        const leadData = leadResult.status === "fulfilled" ? leadResult.value.data?.data : null;
        setLead(leadData);
      })
      .catch((err) => {
        if (cancelled) return;
        const completedMockVisit = visitId === "v4" || visitId === "v5";
        const fallbackItems = fallbackChecklistItems();
        setChecklistItems(fallbackItems);
        setChecks(Object.fromEntries(fallbackItems.map((item) => [item.id, completedMockVisit])));
        setSubmitted(completedMockVisit);
        setNotes(completedMockVisit ? INITIAL_NOTES : "");
        setError(err.response?.data?.error || err.response?.data?.message || "Unable to load site visit report details");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [visitId]);

  const completedCount = useMemo(
    () => Object.values(checks).filter(Boolean).length,
    [checks]
  );
  const progress = checklistItems.length > 0 ? Math.round((completedCount / checklistItems.length) * 100) : 0;
  const requiredMissing = checklistItems.filter((item) => item.required && !checks[item.id]);
  const readOnly = submitted;
  const canSubmit = requiredMissing.length === 0;

  const toggle = (id) => {
    if (readOnly) return;
    setChecks((current) => ({ ...current, [id]: !current[id] }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const { data } = await axiosInstance.post(`/site-visits/EmployeeSiteVisitByUuid/${visitId}/report`, {
        outcome: "QUALIFIED",
        notes,
        items: checklistItems.map((item) => ({
          templateItemUuid: item.id,
          response: checks[item.id] ? "YES" : "",
          remarks: "",
          photoUrls: [],
        })),
      });

      setConversion(data?.data || null);
      setSubmitted(true);
      setSubmitOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Unable to submit site visit report");
      setSubmitOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const clientName = lead?.clientName || "Client";
  const companyName = lead?.company || visit?.locationDetails?.buildingName || "—";
  const assignee = visit?.assignedTo ? `Employee #${visit.assignedTo}` : "Unassigned";
  const templateName = template?.name && template.name !== "string" ? template.name : "Standard inspection checklist";
  const latitude = Number(visit?.latitude);
  const longitude = Number(visit?.longitude);
  const hasCoords = Number.isFinite(latitude) && Number.isFinite(longitude);
  const mapPosition = hasCoords ? [latitude, longitude] : null;
  const scheduledLabel = formatScheduledDateTime(visit?.scheduledDate, visit?.scheduledTime);
  const address = visit ? fullAddress(visit.locationDetails) : "Location not specified";

  return (
    <div className="space-y-6 pb-28">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to={ROUTES.ADMIN.SITE_VISITS}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Site visits
        </Link>
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Site visit report</h1>
          <p className="text-muted-foreground">
            {clientName}{companyName && companyName !== "—" ? ` · ${companyName}` : ""} — {scheduledLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusBadgeVariant(visit?.status)} className="gap-1">
            {readOnly && <Check className="h-3 w-3" />}
            {statusLabel(visit?.status) || "Pending"}
          </Badge>
          {!readOnly && <Badge variant="warning">{progress}% complete</Badge>}
        </div>
      </div>

      {readOnly && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-3 p-4 text-sm text-primary">
            <LockKeyhole className="h-4 w-4" />
            This report is read-only after submission.
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">Loading report details...</CardContent>
        </Card>
      )}

      {!loading && (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(340px,0.9fr)]">
        <div className="space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-primary" />
                Client information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Client</p>
                <p className="font-medium">{clientName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Company</p>
                <p className="font-medium">{companyName}</p>
              </div>
              {lead?.phone && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Phone</p>
                  <p className="flex items-center gap-1.5 font-medium">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    {lead.phone}
                  </p>
                </div>
              )}
              {lead?.email && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                  <p className="flex items-center gap-1.5 font-medium">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {lead.email}
                  </p>
                </div>
              )}
              {lead?.projectType && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Project type</p>
                  <p className="flex items-center gap-1.5 font-medium">
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                    {lead.projectType}
                  </p>
                </div>
              )}
              {lead?.budget !== undefined && Number(lead.budget) > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Budget</p>
                  <p className="flex items-center gap-1.5 font-medium">
                    <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatBudget(lead.budget)}
                  </p>
                </div>
              )}
              {lead?.priority && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Priority</p>
                  <Badge variant="outline" className="font-medium">
                    {lead.priority}
                  </Badge>
                </div>
              )}
              {lead?.referenceNo && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Lead reference</p>
                  <p className="font-mono text-xs font-medium">{lead.referenceNo}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="h-4 w-4 text-primary" />
                Visit schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Date</p>
                <p className="flex items-center gap-1.5 font-medium">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {visit?.scheduledDate || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Time</p>
                <p className="flex items-center gap-1.5 font-medium">
                  <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatTime(visit?.scheduledTime)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Inspector</p>
                <p className="flex items-center gap-1.5 font-medium">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  {assignee}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Checklist template</p>
                <p className="flex items-center gap-1.5 font-medium">
                  <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
                  {templateName}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-primary" />
                Site location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasCoords ? (
                <div className="overflow-hidden rounded-lg border border-border/60">
                  <MapContainer
                    center={mapPosition}
                    zoom={15}
                    scrollWheelZoom={false}
                    className="h-72 w-full"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={mapPosition} />
                  </MapContainer>
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 text-sm text-muted-foreground">
                  Map coordinates not provided
                </div>
              )}

              <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug">{address}</p>
                    {hasCoords && (
                      <p className="mt-1 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                        <Navigation2 className="h-3 w-3" />
                        {latitude.toFixed(6)}, {longitude.toFixed(6)}
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-2 text-primary hover:underline"
                        >
                          Open in map
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                {visit?.locationDetails?.buildingName && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Building</p>
                    <p className="flex items-center gap-1.5 font-medium">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      {visit.locationDetails.buildingName}
                    </p>
                  </div>
                )}
                {visit?.locationDetails?.area && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Area</p>
                    <p className="font-medium">{visit.locationDetails.area}</p>
                  </div>
                )}
                {visit?.locationDetails?.city && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">City</p>
                    <p className="font-medium">{visit.locationDetails.city}</p>
                  </div>
                )}
                {visit?.locationDetails?.state && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">State</p>
                    <p className="font-medium">{visit.locationDetails.state}</p>
                  </div>
                )}
                {visit?.locationDetails?.pincode && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Pincode</p>
                    <p className="font-medium">{visit.locationDetails.pincode}</p>
                  </div>
                )}
                {visit?.locationDetails?.country && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Country</p>
                    <p className="font-medium">{visit.locationDetails.country}</p>
                  </div>
                )}
                {visit?.locationDetails?.floor && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Floor</p>
                    <p className="font-medium">{visit.locationDetails.floor}</p>
                  </div>
                )}
                {visit?.locationDetails?.unitNumber && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Unit</p>
                    <p className="font-medium">{visit.locationDetails.unitNumber}</p>
                  </div>
                )}
                {visit?.locationDetails?.landmark && (
                  <div className="sm:col-span-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Landmark</p>
                    <p className="font-medium">{visit.locationDetails.landmark}</p>
                  </div>
                )}
              </div>

              {visit?.locationDetails?.accessNotes && (
                <div className="rounded-lg border border-amber-200/60 bg-amber-50/60 p-3 text-sm dark:border-amber-500/30 dark:bg-amber-500/10">
                  <p className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">Access notes</p>
                  <p className="mt-1 text-foreground">{visit.locationDetails.accessNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="h-4 w-4 text-primary" />
                Checklist completion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {checklistItems.map((item) => {
                const checked = !!checks[item.id];
                const isRequiredMissing = item.required && !checked && !readOnly;

                return (
                  <label
                    key={item.id}
                    className={[
                      "flex items-start gap-3 rounded-xl border p-3 transition-colors",
                      checked ? "border-primary/20 bg-primary/5" : "border-border/60 bg-card",
                      isRequiredMissing ? "border-destructive/30 bg-destructive/5" : "",
                      readOnly ? "cursor-default" : "cursor-pointer hover:bg-muted/30",
                    ].join(" ")}
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggle(item.id)} disabled={readOnly} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{item.label}</p>
                        {item.sectionName && item.sectionName !== "string" && (
                          <Badge variant="outline" className="text-[10px]">{item.sectionName}</Badge>
                        )}
                        {item.required && (
                          <Badge variant={checked ? "success" : "destructive"} className="text-[10px]">
                            Required
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {checked ? "Completed" : item.required ? "Must be completed before submission" : "Optional inspection item"}
                      </p>
                    </div>
                  </label>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Notes and observations</CardTitle>
            </CardHeader>
            <CardContent>
              <Label className="mb-2 block text-sm">Inspection notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={readOnly}
                rows={5}
                placeholder="Site observations and recommendations..."
              />
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Photos and attachments</CardTitle>
            </CardHeader>
            <CardContent>
              {readOnly ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  {MOCK_PHOTOS.map((label) => (
                    <div
                      key={label}
                      className="flex h-28 items-center justify-center rounded-xl border border-border/60 bg-muted text-xs font-medium text-muted-foreground"
                    >
                      {label}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3">
                  {["Upload image", "Upload image", "Upload image"].map((label, index) => (
                    <div
                      key={index}
                      className="flex h-28 flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 text-muted-foreground"
                    >
                      <ImagePlus className="mb-2 h-7 w-7" />
                      <p className="text-xs">{label}</p>
                    </div>
                  ))}
                  <div className="flex h-28 flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 text-muted-foreground">
                    <Paperclip className="mb-2 h-7 w-7" />
                    <p className="text-xs">Attach notes or files</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-6 border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Visit summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Client</span>
                  <span className="max-w-[60%] text-right font-medium">{clientName}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Scheduled</span>
                  <span className="max-w-[60%] text-right font-medium">
                    {visit?.scheduledDate || "—"}
                    {visit?.scheduledTime && (
                      <span className="block text-xs text-muted-foreground">{formatTime(visit.scheduledTime)}</span>
                    )}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Inspector</span>
                  <span className="max-w-[60%] text-right font-medium">{assignee}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Checklist</span>
                  <span className="max-w-[60%] text-right font-medium">{templateName}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Completion</span>
                  <span className="font-semibold">{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>{completedCount} of {checklistItems.length} done</span>
                  <span>{requiredMissing.length} required pending</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center justify-between gap-3">
                  <span>Mode</span>
                  <span className="font-medium text-foreground">{readOnly ? "Read-only" : "Editable"}</span>
                </div>
                {visit?.createdAt && (
                  <div className="flex items-center justify-between gap-3">
                    <span>Created</span>
                    <span className="font-medium text-foreground">
                      {new Date(visit.createdAt).toLocaleDateString("en-AU", { dateStyle: "medium" })}
                    </span>
                  </div>
                )}
              </div>

              {!readOnly && (
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
                  Required checklist items must be completed before submission. The report becomes read-only once submitted.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      )}

      {!readOnly && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/95 p-4 backdrop-blur md:left-[var(--sidebar-width)]">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button variant="outline" asChild>
              <Link to={ROUTES.ADMIN.SITE_VISITS}>Cancel</Link>
            </Button>
            <Button disabled={!canSubmit} onClick={() => setSubmitOpen(true)} className="gap-2">
              <Check className="h-4 w-4" />
              Submit report
            </Button>
          </div>
        </div>
      )}

      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit report?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            The report will switch to read-only mode after submission.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleSubmit();
              }}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!conversion} onOpenChange={(open) => { if (!open) setConversion(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report submitted</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">The site visit is complete and the linked lead is now a client.</p>
            {conversion?.clientEmail && (
              <div className="rounded-lg border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">Client email</p>
                <p className="font-medium">{conversion.clientEmail}</p>
              </div>
            )}
            {conversion?.temporaryPassword && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs text-muted-foreground">Temporary password</p>
                <p className="font-mono text-base font-semibold">{conversion.temporaryPassword}</p>
              </div>
            )}
            {!conversion?.temporaryPassword && (
              <p className="text-xs text-muted-foreground">An existing account was reused, so no new password was generated.</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setConversion(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
