import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  CalendarClock,
  Check,
  ClipboardList,
  Clock3,
  Download,
  FileText,
  IndianRupee,
  ImagePlus,
  LockKeyhole,
  Mail,
  MapPin,
  Navigation2,
  Phone,
  Plus,
  Trash2,
  User,
  X,
} from "lucide-react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useSiteVisitPortalRoutes } from "@/shared/hooks/use-site-visit-portal-routes";
import { REPORT_CHECKLIST } from "../data/site-visits";
import {
  appendCustomItemToRoomScopes,
  buildCustomChecklistItem,
  checklistItemsFromScopes,
  countScopedItems,
  countScopedRooms,
  isValidRoomScopes,
  parseRoomTabLabel,
  removeCustomItemFromRoomScopes,
} from "../data/renovationChecklist";
import {
  fetchSiteVisitByUuid,
  fetchSiteVisitReport,
  submitSiteVisitReport,
  updateSiteVisitChecklistScope,
  uploadSiteVisitPhoto,
  resolveSiteVisitFileUrl,
  isVideoMediaUrl,
} from "../api/site-visits.api";
import {
  fetchSiteVisitEstimate,
  issueSiteVisitEstimate,
  saveSiteVisitEstimate,
  sendSiteVisitEstimateEmail,
} from "../api/site-visit-estimate.api";
import RoomChecklistScopeBuilder from "../components/site-visits/RoomChecklistScopeBuilder";
import WorkItemSuggestInput from "../components/site-visits/WorkItemSuggestInput";
import VisitDraftBoqEditor from "../components/site-visits/VisitDraftBoqEditor";
import CoverLetterStep from "../components/site-visits/CoverLetterStep";
import SiteVisitAudioRecorder from "../components/site-visits/SiteVisitAudioRecorder";
import { downloadCoverLetterPdf, exportCoverLetterPdfBlob } from "../components/site-visits/coverLetterPdfExport";
import axiosInstance from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const REPORT_STEPS = [
  { id: "checklist", label: "Checklist" },
  { id: "estimate", label: "Draft BoQ" },
  { id: "cover", label: "Cover letter" },
];

const INITIAL_NOTES =
  "Ceiling grid is suitable for LED panels. Client requested premium finish in reception and a clear path for cable runs.";

function fallbackChecklistItems() {
  return REPORT_CHECKLIST.map((item) => ({
    id: item.id,
    label: item.label,
    required: item.required,
    roomName: "General",
    sectionName: "General",
    question: item.label,
  }));
}

function itemsFromVisit(visitData) {
  const scoped = checklistItemsFromScopes(visitData?.roomScopes || []);
  if (scoped.length > 0) return scoped;
  return fallbackChecklistItems();
}

function syncChecksForItems(items, previousChecks = {}, previousNotes = {}, completed = false) {
  const checks = {};
  const notes = {};
  items.forEach((item) => {
    checks[item.id] = completed ? true : !!previousChecks[item.id];
    notes[item.id] = previousNotes[item.id] || "";
  });
  return { checks, notes };
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
  const portal = useSiteVisitPortalRoutes();
  const [searchParams, setSearchParams] = useSearchParams();
  const stepFromUrl = searchParams.get("step");
  const [activeStep, setActiveStep] = useState(
    REPORT_STEPS.some((s) => s.id === stepFromUrl) ? stepFromUrl : "checklist"
  );
  const [submitted, setSubmitted] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [visit, setVisit] = useState(null);
  const [lead, setLead] = useState(null);
  const [checklistItems, setChecklistItems] = useState(fallbackChecklistItems);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingScope, setSavingScope] = useState(false);
  const [error, setError] = useState("");
  const [conversion, setConversion] = useState(null);
  const [checks, setChecks] = useState(() =>
    Object.fromEntries(fallbackChecklistItems().map((item) => [item.id, false]))
  );
  const [itemNotes, setItemNotes] = useState({});
  const [itemPhotos, setItemPhotos] = useState({});
  const [uploadingPhoto, setUploadingPhoto] = useState(null);
  const [editingScope, setEditingScope] = useState(false);
  const [draftPropertyType, setDraftPropertyType] = useState("RESIDENTIAL");
  const [draftPropertyTypeCustom, setDraftPropertyTypeCustom] = useState("");
  const [draftRoomScopes, setDraftRoomScopes] = useState([]);
  const [estimate, setEstimate] = useState(null);
  const [reportItems, setReportItems] = useState([]);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateSaving, setEstimateSaving] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendSuccess, setSendSuccess] = useState("");
  const [sendEmail, setSendEmail] = useState("");
  const [sendSubject, setSendSubject] = useState("");
  const [sendBody, setSendBody] = useState("");
  const [sending, setSending] = useState(false);
  const [customWorkInput, setCustomWorkInput] = useState("");
  const [customWorkPrice, setCustomWorkPrice] = useState("");
  const [addingCustomWork, setAddingCustomWork] = useState(false);
  const coverLetterRef = useRef(null);

  const goToStep = (step) => {
    setActiveStep(step);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("step", step);
      return next;
    });
  };

  const loadEstimate = async () => {
    setEstimateLoading(true);
    try {
      const data = await fetchSiteVisitEstimate(visitId);
      setEstimate(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Unable to load draft BoQ");
      return null;
    } finally {
      setEstimateLoading(false);
    }
  };

  const applyVisitChecklist = (visitData, completed, previousChecks = {}, previousNotes = {}) => {
    const finalItems = itemsFromVisit(visitData);
    const synced = syncChecksForItems(finalItems, previousChecks, previousNotes, completed);
    setChecklistItems(finalItems);
    setChecks(synced.checks);
    setItemNotes(synced.notes);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    (async () => {
      try {
        const visitData = await fetchSiteVisitByUuid(visitId);
        if (cancelled) return;
        setVisit(visitData);
        const completed = String(visitData?.status || "").toUpperCase() === "COMPLETED";
        setSubmitted(completed);
        setNotes(visitData?.notes || (completed ? INITIAL_NOTES : ""));
        setDraftPropertyType(visitData?.propertyType || "RESIDENTIAL");
        setDraftPropertyTypeCustom(visitData?.propertyTypeCustom || "");
        setDraftRoomScopes(visitData?.roomScopes || []);
        applyVisitChecklist(visitData, completed);

        const sideLoads = [];
        if (visitData?.leadId) {
          sideLoads.push(
            axiosInstance
              .get(`/leads/${visitData.leadId}`)
              .then(({ data }) => {
                if (!cancelled) setLead(data?.data ?? data);
              })
              .catch(() => {
                if (!cancelled) setLead(null);
              })
          );
        }
        if (completed) {
          sideLoads.push(
            fetchSiteVisitReport(visitId)
              .then((report) => {
                if (cancelled || !report?.items) return;
                setReportItems(report.items);
                const photos = {};
                const loadedChecks = {};
                const loadedNotes = {};
                const scopeItems = checklistItemsFromScopes(visitData?.roomScopes || []);
                report.items.forEach((item, idx) => {
                  const id = scopeItems[idx]?.id || `report-${idx}`;
                  const matchItem = scopeItems.find(
                    (ci) => ci.question === item.question && ci.roomName === item.roomName
                  );
                  const key = matchItem?.id || id;
                  loadedChecks[key] = String(item.response || "").toUpperCase() === "YES";
                  loadedNotes[key] = item.remarks || "";
                  if (item.photoUrls?.length) {
                    photos[key] = item.photoUrls.map((url) => resolveSiteVisitFileUrl(url));
                  }
                });
                setChecks((prev) => ({ ...prev, ...loadedChecks }));
                setItemNotes((prev) => ({ ...prev, ...loadedNotes }));
                setItemPhotos(photos);
                if (report.notes) setNotes(report.notes);
              })
              .catch(() => {})
          );
          sideLoads.push(
            fetchSiteVisitEstimate(visitId)
              .then((est) => {
                if (cancelled) return;
                setEstimate(est);
                if (stepFromUrl === "estimate" || stepFromUrl === "cover") {
                  setActiveStep(stepFromUrl);
                } else if (est?.status === "ISSUED") {
                  setActiveStep("cover");
                }
              })
              .catch((err) => {
                if (cancelled) return;
                setError(
                  err.response?.data?.error ||
                    err.response?.data?.message ||
                    "Unable to load draft BoQ"
                );
              })
          );
        }
        if (sideLoads.length) await Promise.all(sideLoads);
      } catch (err) {
        if (cancelled) return;
        const completedMockVisit = visitId === "v4" || visitId === "v5";
        const fallbackItems = fallbackChecklistItems();
        setChecklistItems(fallbackItems);
        setChecks(Object.fromEntries(fallbackItems.map((item) => [item.id, completedMockVisit])));
        setItemNotes(Object.fromEntries(fallbackItems.map((item) => [item.id, ""])));
        setSubmitted(completedMockVisit);
        setNotes(completedMockVisit ? INITIAL_NOTES : "");
        setError(err.response?.data?.error || err.response?.data?.message || "Unable to load site visit report details");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [visitId, stepFromUrl]);

  const completedCount = useMemo(
    () => Object.values(checks).filter(Boolean).length,
    [checks]
  );
  const progress = checklistItems.length > 0 ? Math.round((completedCount / checklistItems.length) * 100) : 0;
  const requiredMissing = checklistItems.filter((item) => item.required && !checks[item.id]);
  const incompleteCount = checklistItems.length - completedCount;
  const readOnly = submitted;
  const canContinueToBoq = checklistItems.length > 0 && !editingScope;

  const [activeRoomTab, setActiveRoomTab] = useState("");

  const customWorkExcludeLabels = useMemo(
    () =>
      checklistItems
        .filter((item) => (item.roomName || "General") === activeRoomTab)
        .map((item) => item.question || item.label)
        .filter(Boolean),
    [checklistItems, activeRoomTab]
  );

  const roomTabs = useMemo(() => {
    const byRoom = new Map();
    checklistItems.forEach((item) => {
      const room = item.roomName || "General";
      if (!byRoom.has(room)) byRoom.set(room, new Map());
      const categories = byRoom.get(room);
      const category = item.sectionName || "General";
      if (!categories.has(category)) categories.set(category, []);
      categories.get(category).push(item);
    });

    return [...byRoom.entries()].map(([room, categoriesMap]) => {
      const categories = [...categoriesMap.entries()].map(([category, items]) => ({
        category,
        items,
      }));
      const total = categories.reduce((sum, c) => sum + c.items.length, 0);
      return { room, categories, total };
    });
  }, [checklistItems]);

  useEffect(() => {
    if (roomTabs.length === 0) {
      setActiveRoomTab("");
      return;
    }
    if (!activeRoomTab || !roomTabs.some((t) => t.room === activeRoomTab)) {
      setActiveRoomTab(roomTabs[0].room);
    }
  }, [roomTabs, activeRoomTab]);

  const toggle = (id) => {
    if (readOnly) return;
    setChecks((current) => ({ ...current, [id]: !current[id] }));
  };

  const updateItemNote = (id, value) => {
    if (readOnly) return;
    setItemNotes((current) => ({ ...current, [id]: value }));
  };

  const addCustomWorkItem = async () => {
    const description = customWorkInput.trim();
    const rate = Number(customWorkPrice);
    if (!description || readOnly || !activeRoomTab) return;
    if (!Number.isFinite(rate) || rate <= 0) {
      setError("Enter a valid price in AED for this custom work item.");
      return;
    }

    const { floorName, roomOnly } = parseRoomTabLabel(activeRoomTab);
    const newItem = buildCustomChecklistItem(floorName, roomOnly, "Additional works", description, rate);
    const nextScopes = appendCustomItemToRoomScopes(
      visit?.roomScopes || [],
      floorName,
      roomOnly,
      description,
      "Additional works",
      rate
    );

    setAddingCustomWork(true);
    setError("");
    try {
      const updated = await updateSiteVisitChecklistScope(visitId, {
        propertyType: visit?.propertyType || draftPropertyType,
        propertyTypeCustom: visit?.propertyTypeCustom || draftPropertyTypeCustom,
        roomScopes: nextScopes,
      });
      setVisit(updated);
      setDraftRoomScopes(updated.roomScopes || []);
      setChecklistItems((items) => [...items, newItem]);
      setChecks((current) => ({ ...current, [newItem.id]: false }));
      setCustomWorkInput("");
      setCustomWorkPrice("");
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Unable to add work item");
    } finally {
      setAddingCustomWork(false);
    }
  };

  const removeCustomWorkItem = async (item) => {
    if (readOnly || !item?.custom) return;

    const { floorName, roomOnly } = parseRoomTabLabel(item.roomName || activeRoomTab);
    const nextScopes = removeCustomItemFromRoomScopes(
      visit?.roomScopes || [],
      floorName,
      roomOnly,
      item.question || item.label
    );

    setAddingCustomWork(true);
    setError("");
    try {
      const updated = await updateSiteVisitChecklistScope(visitId, {
        propertyType: visit?.propertyType || draftPropertyType,
        propertyTypeCustom: visit?.propertyTypeCustom || draftPropertyTypeCustom,
        roomScopes: nextScopes,
      });
      setVisit(updated);
      setDraftRoomScopes(updated.roomScopes || []);
      setChecklistItems((items) => items.filter((i) => i.id !== item.id));
      setChecks((current) => {
        const next = { ...current };
        delete next[item.id];
        return next;
      });
      setItemNotes((current) => {
        const next = { ...current };
        delete next[item.id];
        return next;
      });
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Unable to remove work item");
    } finally {
      setAddingCustomWork(false);
    }
  };

  const startEditScope = () => {
    setDraftPropertyType(visit?.propertyType || "RESIDENTIAL");
    setDraftPropertyTypeCustom(visit?.propertyTypeCustom || "");
    setDraftRoomScopes(visit?.roomScopes || []);
    setEditingScope(true);
    setError("");
  };

  const cancelEditScope = () => {
    setDraftPropertyType(visit?.propertyType || "RESIDENTIAL");
    setDraftPropertyTypeCustom(visit?.propertyTypeCustom || "");
    setDraftRoomScopes(visit?.roomScopes || []);
    setEditingScope(false);
  };

  const saveScope = async () => {
    if (draftPropertyType === "CUSTOM" && !draftPropertyTypeCustom.trim()) {
      setError("Enter a custom property type label.");
      return;
    }
    if (!isValidRoomScopes(draftRoomScopes)) {
      setError("Add at least one floor with a room, category, and one or more checklist items.");
      return;
    }
    setSavingScope(true);
    setError("");
    try {
      const updated = await updateSiteVisitChecklistScope(visitId, {
        propertyType: draftPropertyType,
        propertyTypeCustom: draftPropertyTypeCustom,
        roomScopes: draftRoomScopes,
      });
      setVisit(updated);
      applyVisitChecklist(updated, false, checks, itemNotes);
      setEditingScope(false);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Unable to update checklist scope");
    } finally {
      setSavingScope(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const submittedReportItems = checklistItems.map((item) => ({
        response: checks[item.id] ? "YES" : "NO",
        remarks: itemNotes[item.id] || "",
        roomName: item.roomName || "",
        sectionName: item.sectionName || "",
        question: item.question || item.label || "",
        photoUrls: itemPhotos[item.id] || [],
      }));
      const data = await submitSiteVisitReport(visitId, {
        outcome: "QUALIFIED",
        notes,
        items: submittedReportItems,
      });

      setReportItems(submittedReportItems);
      setConversion(data || null);
      setSubmitted(true);
      setSubmitOpen(false);
      setVisit((current) => (current ? { ...current, status: "COMPLETED" } : current));
      const est = await loadEstimate();
      if (est) goToStep("estimate");
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Unable to submit site visit report");
      setSubmitOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEstimate = async () => {
    if (!estimate) return false;
    setEstimateSaving(true);
    setError("");
    try {
      const saved = await saveSiteVisitEstimate(visitId, estimate);
      setEstimate(saved);
      return true;
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Unable to save draft BoQ");
      return false;
    } finally {
      setEstimateSaving(false);
    }
  };

  const handlePhotoUpload = async (itemId, fileList) => {
    const files = Array.from(fileList || []).filter(Boolean);
    if (!files.length || readOnly) return;
    setUploadingPhoto(itemId);
    setError("");
    try {
      const uploaded = [];
      for (const file of files) {
        const result = await uploadSiteVisitPhoto(visitId, file);
        if (result?.url) uploaded.push(result.url);
      }
      if (!uploaded.length) {
        setError("Upload completed but no file URL was returned.");
        return;
      }
      setItemPhotos((prev) => ({
        ...prev,
        [itemId]: [...(prev[itemId] || []), ...uploaded],
      }));
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to upload photo or video"
      );
    } finally {
      setUploadingPhoto(null);
    }
  };

  const handleRemovePhoto = (itemId, index) => {
    if (readOnly) return;
    setItemPhotos((prev) => {
      const next = [...(prev[itemId] || [])];
      next.splice(index, 1);
      return { ...prev, [itemId]: next };
    });
  };

  const handleIssueAndDownload = async () => {
    if (!estimate) return;
    setEstimateSaving(true);
    setError("");
    try {
      let issued = estimate;
      if (estimate.status !== "ISSUED") {
        await saveSiteVisitEstimate(visitId, estimate);
        issued = await issueSiteVisitEstimate(visitId);
        setEstimate(issued);
      }
      setPdfExporting(true);
      await downloadCoverLetterPdf(
        "site-visit-cover-letter",
        `${issued.quoteNo || "JCT-Cover-Letter"}.pdf`
      );
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Unable to issue cover letter");
    } finally {
      setEstimateSaving(false);
      setPdfExporting(false);
    }
  };

  const handleDownloadPdfOnly = async () => {
    if (!estimate) return;
    setPdfExporting(true);
    setError("");
    try {
      await downloadCoverLetterPdf(
        "site-visit-cover-letter",
        `${estimate.quoteNo || "JCT-Cover-Letter"}.pdf`
      );
    } catch (err) {
      setError(err.message || "Unable to download cover letter PDF");
    } finally {
      setPdfExporting(false);
    }
  };

  const handleSendToClient = async () => {
    if (!estimate || !sendEmail.trim()) return;
    setSending(true);
    setError("");
    try {
      let issued = estimate;
      if (estimate.status !== "ISSUED") {
        await saveSiteVisitEstimate(visitId, estimate);
        issued = await issueSiteVisitEstimate(visitId);
        setEstimate(issued);
      }
      setPdfExporting(true);
      const pdfBlob = await exportCoverLetterPdfBlob("site-visit-cover-letter");
      const pdfFile = new File(
        [pdfBlob],
        `${issued.quoteNo || "Cover-Letter"}.pdf`,
        { type: "application/pdf" }
      );
      await sendSiteVisitEstimateEmail(visitId, {
        recipientEmail: sendEmail.trim(),
        subject: sendSubject || `Quotation ${issued.quoteNo || ""}`.trim(),
        messageBody: sendBody || "Please find attached our quotation and appendix documents.",
        attachments: [pdfFile],
      });
      setSendOpen(false);
      setSendSuccess(`Estimate emailed to ${sendEmail.trim()}`);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Unable to send email");
    } finally {
      setSending(false);
      setPdfExporting(false);
    }
  };

  const openSendDialog = () => {
    setSendSuccess("");
    setSendEmail(lead?.email || "");
    setSendSubject(
      estimate?.quoteNo
        ? `Quotation — ${estimate.quoteNo}`
        : estimate?.subject
          ? `Quotation — ${estimate.subject}`
          : "Quotation"
    );
    setSendBody("Dear Client,\n\nPlease find attached our quotation document with cover letter, draft BoQ summary, and selected appendix pages.\n\nKind regards,\nOnePath Solutions");
    setSendOpen(true);
  };

  const estimateReadOnly = estimate?.status === "ISSUED";
  const canOpenEstimateSteps = submitted;
  const effectiveStep =
    !canOpenEstimateSteps && activeStep !== "checklist" ? "checklist" : activeStep;
  const clientName = lead?.clientName || "Client";
  const companyName = lead?.company || visit?.locationDetails?.buildingName || "—";
  const assignee = visit?.employeeNames?.length
    ? visit.employeeNames.join(", ")
    : visit?.assignedTo
      ? `Employee #${visit.assignedTo}`
      : "Unassigned";
  const propertyTypeLabel =
    visit?.propertyType === "CUSTOM"
      ? visit?.propertyTypeCustom || "Custom"
      : visit?.propertyType
        ? visit.propertyType.charAt(0) + visit.propertyType.slice(1).toLowerCase()
        : null;
  const latitude = Number(visit?.latitude);
  const longitude = Number(visit?.longitude);
  const hasCoords = Number.isFinite(latitude) && Number.isFinite(longitude);
  const mapPosition = hasCoords ? [latitude, longitude] : null;
  const scheduledLabel = formatScheduledDateTime(visit?.scheduledDate, visit?.scheduledTime);
  const address = visit ? fullAddress(visit.locationDetails) : "Location not specified";
  const scopedItemCount = countScopedItems(visit?.roomScopes || []);

  return (
    <div className="space-y-6 pb-28">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to={portal.list}>
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
          {!readOnly && effectiveStep === "checklist" && (
            <Badge variant="warning">{progress}% complete</Badge>
          )}
          {estimate?.status === "ISSUED" && (
            <Badge variant="success">Draft BoQ issued</Badge>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {REPORT_STEPS.map((step) => {
          const locked = step.id !== "checklist" && !canOpenEstimateSteps;
          const active = effectiveStep === step.id;
          return (
            <button
              key={step.id}
              type="button"
              disabled={locked}
              onClick={() => {
                if (locked) return;
                if ((step.id === "estimate" || step.id === "cover") && !estimate) {
                  loadEstimate().then(() => goToStep(step.id));
                } else {
                  goToStep(step.id);
                }
              }}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-all ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : locked
                    ? "cursor-not-allowed border-border/40 bg-muted/30 text-muted-foreground"
                    : "border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {step.label}
            </button>
          );
        })}
      </div>

      {readOnly && effectiveStep === "checklist" && (
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

      {!loading && effectiveStep === "estimate" && (
        <Card className="">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-primary" />
              Draft BoQ
            </CardTitle>
          </CardHeader>
          <CardContent>
            {estimateLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading draft BoQ...</p>
            ) : !estimate ? (
              <div className="space-y-3 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {error || "Could not load the draft BoQ."}
                </p>
                <Button type="button" variant="outline" size="sm" onClick={loadEstimate}>
                  Retry
                </Button>
              </div>
            ) : (
              <VisitDraftBoqEditor
                estimate={estimate}
                roomScopes={visit?.roomScopes || []}
                reportItems={reportItems}
                disabled={estimateReadOnly || estimateSaving}
                onChange={setEstimate}
              />
            )}
          </CardContent>
        </Card>
      )}

      {!loading && effectiveStep === "cover" && (
        <Card className="">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" />
              Cover letter
            </CardTitle>
          </CardHeader>
          <CardContent>
            {estimateLoading || !estimate ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading cover letter...</p>
            ) : (
              <CoverLetterStep
                estimate={estimate}
                disabled={estimateReadOnly || estimateSaving}
                onChange={setEstimate}
                previewRef={coverLetterRef}
              />
            )}
          </CardContent>
        </Card>
      )}

      {!loading && effectiveStep === "checklist" && (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(340px,0.9fr)]">
        <div className="space-y-6">
          <Card className="">
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

          <Card className="">
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
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Property type</p>
                <p className="flex items-center gap-1.5 font-medium">
                  <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
                  {propertyTypeLabel || "Not set"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="">
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Check className="h-4 w-4 text-primary" />
                Renovation checklist scope
              </CardTitle>
              {!readOnly ? (
                editingScope ? (
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={cancelEditScope} disabled={savingScope}>
                      Cancel
                    </Button>
                    <Button type="button" size="sm" onClick={saveScope} disabled={savingScope}>
                      {savingScope ? "Saving..." : "Save scope"}
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={startEditScope}>
                    Refine scope
                  </Button>
                )
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              {editingScope ? (
                <RoomChecklistScopeBuilder
                  propertyType={draftPropertyType}
                  propertyTypeCustom={draftPropertyTypeCustom}
                  roomScopes={draftRoomScopes}
                  onPropertyTypeChange={setDraftPropertyType}
                  onPropertyTypeCustomChange={setDraftPropertyTypeCustom}
                  onRoomScopesChange={setDraftRoomScopes}
                  disabled={savingScope}
                />
              ) : visit?.roomScopes?.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {propertyTypeLabel || "Type not set"} · {visit.roomScopes.length} floor
                    {visit.roomScopes.length === 1 ? "" : "s"} · {countScopedRooms(visit.roomScopes)}{" "}
                    room
                    {countScopedRooms(visit.roomScopes) === 1 ? "" : "s"} · {scopedItemCount} item
                    {scopedItemCount === 1 ? "" : "s"}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {visit.roomScopes.map((floor) => (
                      <div
                        key={floor.floorName}
                        className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm"
                      >
                        <p className="font-medium">{floor.floorName}</p>
                        <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                          {(floor.rooms || []).map((room) => (
                            <li key={`${floor.floorName}-${room.roomName}`}>
                              <span className="font-medium text-foreground">{room.roomName}</span>
                              {(room.selections || []).length > 0
                                ? `: ${(room.selections || [])
                                    .map(
                                      (sel) =>
                                        `${sel.category} (${(sel.items || []).length})`
                                    )
                                    .join(", ")}`
                                : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No room scope saved yet. Use Refine scope to add floors, rooms, categories, and items.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="">
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
                          href={
                            visit?.locationDetails?.mapsShareUrl
                            || `https://www.google.com/maps?q=${latitude},${longitude}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="ml-2 text-primary hover:underline"
                        >
                          Open in Google Maps
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

          <Card className="">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="h-4 w-4 text-primary" />
                Checklist completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingScope ? (
                <p className="text-sm text-muted-foreground">
                  Save the refined floor/room scope above to update checklist items for completion.
                </p>
              ) : roomTabs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No checklist items for this visit scope.</p>
              ) : (
                <Tabs value={activeRoomTab} onValueChange={setActiveRoomTab} className="space-y-4">
                  <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/40 p-1">
                    {roomTabs.map(({ room, total }) => {
                      const done = checklistItems
                        .filter((item) => (item.roomName || "General") === room && checks[item.id])
                        .length;
                      return (
                        <TabsTrigger
                          key={room}
                          value={room}
                          className="gap-1.5 px-3 py-1.5 text-xs data-[state=active]:shadow-sm"
                        >
                          <span>{room}</span>
                          <Badge
                            variant={done < total ? "destructive" : "secondary"}
                            className="h-5 min-w-5 justify-center rounded-md px-1.5 text-[10px] font-medium"
                          >
                            {done}/{total}
                          </Badge>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>

                  {roomTabs.map(({ room, categories }) => (
                    <TabsContent key={room} value={room} className="mt-0 space-y-5">
                      {categories.map(({ category, items }) => {
                        const categoryDone = items.filter((item) => checks[item.id]).length;
                        return (
                          <section key={`${room}-${category}`} className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
                              <h3 className="text-sm font-semibold">{category}</h3>
                              <Badge variant="outline" className="text-[10px]">
                                {categoryDone}/{items.length} done
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              {items.map((item) => {
                                const checked = !!checks[item.id];
                                const isRequiredMissing = item.required && !checked && !readOnly;

                                return (
                                  <div
                                    key={item.id}
                                    className={[
                                      "rounded-xl border p-3 transition-colors",
                                      checked ? "border-primary/20 bg-primary/5" : "border-border/60 bg-card",
                                      isRequiredMissing ? "border-destructive/30 bg-destructive/5" : "",
                                    ].join(" ")}
                                  >
                                    <div className="flex items-start gap-3">
                                      <Checkbox
                                        checked={checked}
                                        onCheckedChange={() => toggle(item.id)}
                                        disabled={readOnly}
                                        className="mt-0.5"
                                      />
                                      <div className="min-w-0 flex-1 space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <p className="text-sm font-medium">{item.label}</p>
                                          {item.custom && (
                                            <Badge variant="outline" className="text-[10px]">
                                              Custom
                                            </Badge>
                                          )}
                                          {item.required && (
                                            <Badge
                                              variant={checked ? "success" : "destructive"}
                                              className="text-[10px]"
                                            >
                                              Required
                                            </Badge>
                                          )}
                                          {item.custom && !readOnly && (
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              className="ml-auto h-7 w-7 text-destructive"
                                              disabled={addingCustomWork}
                                              onClick={() => removeCustomWorkItem(item)}
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                          )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                          {checked
                                            ? "Completed"
                                            : item.required
                                              ? "Required inspection item"
                                              : "Optional inspection item"}
                                        </p>
                                        {item.custom && item.rateAed != null && (
                                          <p className="text-xs font-medium text-foreground">
                                            Price:{" "}
                                            {Number(item.rateAed).toLocaleString("en-AE", {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            })}{" "}
                                            AED
                                          </p>
                                        )}
                                        <div>
                                          <Label
                                            htmlFor={`note-${item.id}`}
                                            className="mb-1 block text-[11px] font-medium text-muted-foreground"
                                          >
                                            Notes (optional)
                                          </Label>
                                          <Textarea
                                            id={`note-${item.id}`}
                                            value={itemNotes[item.id] || ""}
                                            onChange={(e) => updateItemNote(item.id, e.target.value)}
                                            disabled={readOnly}
                                            rows={2}
                                            placeholder="Add size, brand, condition, or other remarks…"
                                            className="min-h-[56px] resize-y text-sm"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </section>
                        );
                      })}

                      {!readOnly && (
                        <div className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-border/60 bg-muted/10 p-3">
                          <div className="min-w-[200px] flex-1">
                            <WorkItemSuggestInput
                              value={customWorkInput}
                              onChange={setCustomWorkInput}
                              onSubmit={addCustomWorkItem}
                              disabled={addingCustomWork}
                              excludeLabels={customWorkExcludeLabels}
                            />
                          </div>
                          <div className="w-36 space-y-1">
                            <Label className="text-xs">Price (AED)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={customWorkPrice}
                              placeholder="0.00"
                              disabled={addingCustomWork}
                              onChange={(e) => setCustomWorkPrice(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addCustomWorkItem();
                                }
                              }}
                            />
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            className="gap-1.5"
                            disabled={
                              !customWorkInput.trim() ||
                              !customWorkPrice ||
                              Number(customWorkPrice) <= 0 ||
                              addingCustomWork
                            }
                            onClick={addCustomWorkItem}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </CardContent>
          </Card>

          <Card className="">
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

          <SiteVisitAudioRecorder visitId={visitId} readOnly={readOnly} />

          <Card className="">
            <CardHeader>
              <CardTitle className="text-base">Photos and attachments</CardTitle>
              <p className="text-sm text-muted-foreground">
                Add multiple photos or videos for each checklist item.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roomTabs.map(({ room, categories }) => (
                  <div key={room}>
                    <p className="text-sm font-medium mb-2">{room}</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {categories.flatMap((c) => c.items).map((item) => {
                        const photos = itemPhotos[item.id] || [];
                        const uploading = uploadingPhoto === item.id;
                        return (
                          <div key={item.id} className="space-y-2 rounded-lg border border-border/60 p-3">
                            <p className="text-xs font-medium text-foreground truncate">{item.label || item.question}</p>
                            <div className="flex flex-wrap gap-2">
                              {photos.map((url, i) => (
                                <div key={`${url}-${i}`} className="relative">
                                  {isVideoMediaUrl(url) ? (
                                    <video
                                      src={url}
                                      controls
                                      className="h-20 w-20 rounded-lg object-cover border border-border/60 bg-black"
                                    />
                                  ) : (
                                    <img
                                      src={url}
                                      alt=""
                                      className="h-20 w-20 rounded-lg object-cover border border-border/60"
                                    />
                                  )}
                                  {!readOnly && (
                                    <button
                                      type="button"
                                      aria-label="Remove attachment"
                                      onClick={() => handleRemovePhoto(item.id, i)}
                                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              ))}
                              {!readOnly && (
                                <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/20 text-muted-foreground hover:bg-muted/40">
                                  <ImagePlus className="h-5 w-5 mb-1" />
                                  <span className="text-[10px] text-center px-1">
                                    {uploading ? "Uploading…" : "Add files"}
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*,video/*"
                                    multiple
                                    className="hidden"
                                    disabled={uploading}
                                    onChange={(e) => {
                                      const selected = e.target.files;
                                      if (selected?.length) handlePhotoUpload(item.id, selected);
                                      e.target.value = "";
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {roomTabs.length === 0 && (
                  <p className="text-sm text-muted-foreground">Add checklist items to attach photos.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-6  ">
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
                  <span className="text-muted-foreground">Property type</span>
                  <span className="max-w-[60%] text-right font-medium">{propertyTypeLabel || "—"}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">Scope</span>
                  <span className="max-w-[60%] text-right font-medium">
                    {scopedItemCount} item{scopedItemCount === 1 ? "" : "s"}
                  </span>
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
                  {completedCount}/{checklistItems.length} checklist items done. You can continue to
                  draft BoQ without completing every item. The report becomes read-only after you
                  continue.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      )}

      {effectiveStep === "checklist" && !readOnly && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/95 p-4 backdrop-blur md:left-[var(--sidebar-width)]">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            {incompleteCount > 0 && checklistItems.length > 0 && (
              <p className="text-xs text-muted-foreground sm:mr-auto">
                {incompleteCount} of {checklistItems.length} items not checked — you can still
                continue to draft BoQ
              </p>
            )}
            <Button variant="outline" asChild>
              <Link to={portal.list}>Cancel</Link>
            </Button>
            <Button disabled={!canContinueToBoq} onClick={() => setSubmitOpen(true)} className="gap-2">
              <Check className="h-4 w-4" />
              Continue to BoQ
            </Button>
          </div>
        </div>
      )}

      {effectiveStep === "estimate" && canOpenEstimateSteps && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/95 p-4 backdrop-blur md:left-[var(--sidebar-width)]">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button variant="outline" onClick={() => goToStep("checklist")}>
              Back to checklist
            </Button>
            {!estimateReadOnly && (
              <Button
                variant="outline"
                disabled={!estimate || estimateSaving}
                onClick={handleSaveEstimate}
              >
                {estimateSaving ? "Saving..." : "Save draft BoQ"}
              </Button>
            )}
            <Button
              disabled={!estimate || estimateLoading || estimateSaving}
              onClick={async () => {
                if (!estimateReadOnly) {
                  const ok = await handleSaveEstimate();
                  if (!ok) return;
                }
                goToStep("cover");
              }}
              className="gap-2"
            >
              Continue to cover letter
            </Button>
          </div>
        </div>
      )}

      {effectiveStep === "cover" && canOpenEstimateSteps && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/95 p-4 backdrop-blur md:left-[var(--sidebar-width)]">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button variant="outline" onClick={() => goToStep("estimate")}>
              Back to draft BoQ
            </Button>
            {!estimateReadOnly && (
              <Button
                variant="outline"
                disabled={!estimate || estimateSaving}
                onClick={handleSaveEstimate}
              >
                {estimateSaving ? "Saving..." : "Save draft"}
              </Button>
            )}
            <Button
              variant="outline"
              disabled={!estimate || estimateSaving || pdfExporting}
              onClick={openSendDialog}
              className="gap-2"
            >
              <Mail className="h-4 w-4" />
              Email estimate to client
            </Button>
            {sendSuccess && (
              <p className="text-xs text-emerald-700">{sendSuccess}</p>
            )}
            <Button
              disabled={!estimate || estimateSaving || pdfExporting}
              onClick={estimateReadOnly ? handleDownloadPdfOnly : handleIssueAndDownload}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {pdfExporting
                ? "Preparing PDF..."
                : estimateReadOnly
                  ? "Download PDF"
                  : "Issue & download PDF"}
            </Button>
          </div>
        </div>
      )}

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email estimate to client</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Recipient email</Label>
              <Input value={sendEmail} onChange={(e) => setSendEmail(e.target.value)} type="email" />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={sendSubject} onChange={(e) => setSendSubject(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={sendBody} onChange={(e) => setSendBody(e.target.value)} rows={5} />
            </div>
            <p className="text-xs text-muted-foreground">
              Attaches the cover letter PDF (including BoQ summary and selected appendix pages).
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)}>Cancel</Button>
            <Button disabled={sending || !sendEmail.trim()} onClick={handleSendToClient}>
              {sending ? "Sending…" : "Send email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Continue to draft BoQ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {incompleteCount > 0
              ? `${incompleteCount} checklist item${incompleteCount === 1 ? "" : "s"} are not checked yet. Unchecked items will be saved as "No" on the report. `
              : ""}
            The report will switch to read-only mode and you can prepare a draft BoQ and cover letter.
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
              {submitting ? "Continuing..." : "Continue to BoQ"}
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
            <p className="text-muted-foreground">
              The site visit is complete. The lead stays as a lead until you manually convert them to a client.
              Next, prepare a draft BoQ and cover letter.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConversion(null);
                goToStep("checklist");
              }}
            >
              Stay on checklist
            </Button>
            <Button
              onClick={() => {
                setConversion(null);
                goToStep("estimate");
              }}
            >
              Continue to draft BoQ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
