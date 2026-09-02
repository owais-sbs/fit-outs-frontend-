import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Calendar, Check, CheckSquare, Clock3, Crosshair, Loader2, MapPin, Navigation2, Search, ShieldCheck, Sparkles, X } from "lucide-react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { ROUTES } from "@/shared/constants/routes";
import { ROLE_LABELS, SITE_VISIT_ASSIGNABLE_ROLES } from "@/shared/constants/roles";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { fetchAllLeads } from "../api/leads.api";
import { fetchAllEmployees } from "../api/employees.api";
import { createSiteVisit, addLocationDetails } from "../api/site-visits.api";
import { googleMapsShareUrl, isMapsShareUrl, resolveLocationQuery } from "../api/geocode.api";
import { fetchAllClients } from "../api/clients.api";
import {
  countScopedItems,
  countScopedRooms,
  deriveCategoriesFromScopes,
  deriveRoomsFromScopes,
  isValidRoomScopes,
} from "../data/renovationChecklist";
import RoomChecklistScopeBuilder from "../components/site-visits/RoomChecklistScopeBuilder";
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

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_COORDINATES = { lat: -33.86882, lng: 151.20929 };
const toDateInput = (date) => date.toISOString().slice(0, 10);
const addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateInput(date);
};
const QUICK_DATES = [
  { label: "Today", value: addDays(0) },
  { label: "Tomorrow", value: addDays(1) },
  { label: "Next week", value: addDays(7) },
];
const QUICK_TIMES = ["08:30", "10:00", "13:30", "15:00"];
const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";

const EMPTY_ADDRESS = {
  addressLine1: "",
  addressLine2: "",
  buildingName: "",
  unitNumber: "",
  floor: "",
  landmark: "",
  area: "",
  city: "",
  state: "",
  country: "",
  pincode: "",
  mapsShareUrl: "",
};

function pickAddressField(address, ...keys) {
  if (!address) return "";
  for (const key of keys) {
    const value = address[key];
    if (value) return value;
  }
  return "";
}

function addressFromNominatimResult(result) {
  const address = result?.address || {};
  const road = pickAddressField(address, "road", "pedestrian", "footway", "residential");
  const house = address.house_number || "";
  const suburb = pickAddressField(address, "suburb", "neighbourhood", "quarter", "hamlet");
  const line1 = house && road ? `${house} ${road}` : road || result?.display_name || "";
  return {
    addressLine1: line1,
    addressLine2: suburb,
    area: suburb,
    city: pickAddressField(address, "city", "town", "village", "municipality", "county") || "",
    state: pickAddressField(address, "state", "region") || "",
    country: address.country || "",
    pincode: address.postcode || "",
  };
}

function parseCoordinate(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

async function searchLocations(query, signal) {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    limit: "5",
  });

  const response = await fetch(`${NOMINATIM_SEARCH_URL}?${params.toString()}`, {
    signal,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Location search failed");
  }

  return response.json();
}

async function reverseGeocode(latitude, longitude, signal) {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: "jsonv2",
  });

  const response = await fetch(`${NOMINATIM_REVERSE_URL}?${params.toString()}`, {
    signal,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Reverse geocoding failed");
  }

  return response.json();
}

function MapRecenter({ position }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, map.getZoom(), { animate: true });
  }, [map, position]);
  return null;
}

function LocationPickerMap({ position, onChange }) {
  useMapEvents({
    click(event) {
      onChange(event.latlng.lat, event.latlng.lng);
    },
  });

  return (
    <>
      <MapRecenter position={position} />
      <Marker position={position} />
    </>
  );
}

export default function SiteVisitSchedulePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const leadIdParam = searchParams.get("leadId");
  const [leadPrefillWarning, setLeadPrefillWarning] = useState("");
  const locationSearchControllerRef = useRef(null);
  const reverseGeocodeControllerRef = useRef(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [createdVisitUuid, setCreatedVisitUuid] = useState(null);
  const [leads, setLeads] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [targetType, setTargetType] = useState("lead"); // "lead" or "client"
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);
  const [locationSearchLoading, setLocationSearchLoading] = useState(false);
  const [form, setForm] = useState({
    leadId: "",
    employeeIds: [],
    date: "",
    time: "",
    location: "",
    latitude: "-33.868820",
    longitude: "151.209290",
    notes: "",
    propertyType: "RESIDENTIAL",
    propertyTypeCustom: "",
    roomScopes: [],
    address: { ...EMPTY_ADDRESS },
  });

  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  const [staffDropdownOpen, setStaffDropdownOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadLeads = fetchAllLeads()
      .then((leadList) => {
        if (!cancelled) setLeads(leadList);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.response?.data?.error || err.response?.data?.message || "Unable to load leads");
      });

    const loadEmployees = fetchAllEmployees()
      .then((empList) => {
        if (cancelled) return;
        const active = empList.filter((e) => e.isActive !== false);
        const assignable = active.filter(
          (e) => !e.role || SITE_VISIT_ASSIGNABLE_ROLES.includes(e.role)
        );
        // Prefer assignable roles; if none match (legacy data), still show all active staff
        setEmployees(assignable.length > 0 ? assignable : active);
      })
      .catch((err) => {
        if (cancelled) return;
        setEmployees([]);
        setError(err.response?.data?.error || err.response?.data?.message || "Unable to load staff");
      });

    const loadClients = fetchAllClients()
      .then((clientList) => {
        if (!cancelled) setClients(clientList);
      })
      .catch(() => {
        if (!cancelled) setClients([]);
      });

    Promise.allSettled([loadLeads, loadEmployees, loadClients]).finally(() => {
      if (!cancelled) setLoadingOptions(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!leadIdParam || loadingOptions) return;
    const match = leads.find((l) => String(l.id) === String(leadIdParam));
    if (match) {
      setTargetType("lead");
      setForm((prev) => ({ ...prev, leadId: String(match.id) }));
      setLeadPrefillWarning("");
    } else if (targetType === "lead") {
      setLeadPrefillWarning(`Lead #${leadIdParam} was not found in the list. Select manually or check that it exists.`);
    }
  }, [leadIdParam, leads, loadingOptions, targetType]);

  useEffect(() => {
    setLocationQuery(form.location);
  }, [form.location]);

  const selectedLead = leads.find((l) => l.id === form.leadId);
  const selectedClient = clients.find((c) => c.id === form.leadId);
  const selectedEntity = targetType === "lead" ? selectedLead : selectedClient;
  const selectedEmployees = employees.filter((e) => form.employeeIds.includes(Number(e.id)));

  const filteredEmployees = useMemo(() => {
    const query = staffSearchQuery.toLowerCase().trim();
    if (!query) return employees;
    return employees.filter((e) => {
      const name = (e.employeeName || e.fullName || "").toLowerCase();
      const role = (e.roleLabel || ROLE_LABELS[e.role] || "").toLowerCase();
      const designation = (e.designation || "").toLowerCase();
      return name.includes(query) || role.includes(query) || designation.includes(query);
    });
  }, [employees, staffSearchQuery]);

  const summaryItems = useMemo(
    () => [
      {
        label: targetType === "lead" ? "Lead" : "Client",
        value: selectedEntity
          ? (targetType === "lead" ? `${selectedEntity.clientName}` : `${selectedEntity.fullName}`)
          : (targetType === "lead" ? "Select a lead" : "Select a client"),
      },
      { label: "Date", value: form.date || "Pending" },
      { label: "Time", value: form.time || "Pending" },
      {
        label: "Staff",
        value: selectedEmployees.length > 0
          ? selectedEmployees.map((e) => e.employeeName || e.fullName).join(", ")
          : "Assign staff",
      },
      {
        label: "Type",
        value:
          form.propertyType === "CUSTOM"
            ? form.propertyTypeCustom?.trim() || "Custom"
            : form.propertyType
              ? form.propertyType.charAt(0) + form.propertyType.slice(1).toLowerCase()
              : "Select type",
      },
      {
        label: "Floors",
        value:
          form.roomScopes.length > 0
            ? form.roomScopes.map((f) => f.floorName).filter(Boolean).join(", ")
            : "Add floors",
      },
      {
        label: "Rooms",
        value: `${countScopedRooms(form.roomScopes)} added`,
      },
      {
        label: "Items",
        value: `${countScopedItems(form.roomScopes)} selected`,
      },
    ],
    [form.date, form.time, form.propertyType, form.propertyTypeCustom, form.roomScopes, selectedEntity, selectedEmployees, targetType]
  );

  const updateAddress = (field, value) => {
    setForm((f) => ({
      ...f,
      address: { ...f.address, [field]: value },
    }));
    setError("");
  };

  const applyGeocodeResult = (result, mapsUrlOverride) => {
    const lat = Number(result.latitude);
    const lng = Number(result.longitude);
    setForm((f) => ({
      ...f,
      location: result.displayName || f.location,
      latitude: Number.isFinite(lat) ? lat.toFixed(8) : f.latitude,
      longitude: Number.isFinite(lng) ? lng.toFixed(8) : f.longitude,
      address: {
        ...f.address,
        addressLine1: result.addressLine1 || f.address.addressLine1,
        addressLine2: result.addressLine2 || f.address.addressLine2,
        area: result.area || f.address.area,
        city: result.city || f.address.city,
        state: result.state || f.address.state,
        country: result.country || f.address.country,
        pincode: result.pincode || f.address.pincode,
        mapsShareUrl:
          mapsUrlOverride ||
          result.mapsShareUrl ||
          (Number.isFinite(lat) && Number.isFinite(lng)
            ? googleMapsShareUrl(lat, lng, result.displayName)
            : f.address.mapsShareUrl),
      },
    }));
    setLocationQuery(result.displayName || "");
    setLocationResults([]);
    setLocationSearchOpen(false);
    setError("");
  };

  const resolveLocationFromQuery = async (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setLocationSearchLoading(true);
    setError("");
    try {
      const result = await resolveLocationQuery(trimmed);
      applyGeocodeResult(result, isMapsShareUrl(trimmed) ? trimmed : undefined);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to resolve that location.");
    } finally {
      setLocationSearchLoading(false);
    }
  };

  const update = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  };

  const handleTypeChange = (type) => {
    setTargetType(type);
    update("leadId", "");
  };

  const updateCoordinates = (latitude, longitude) => {
    setForm((f) => ({
      ...f,
      latitude: latitude.toFixed(8),
      longitude: longitude.toFixed(8),
    }));
    setError("");
  };

  const applyLocationSelection = (result) => {
    const latitude = Number(result.lat);
    const longitude = Number(result.lon);
    const parsed = addressFromNominatimResult(result);
    setForm((f) => ({
      ...f,
      location: result.display_name || f.location,
      latitude: Number.isFinite(latitude) ? latitude.toFixed(8) : f.latitude,
      longitude: Number.isFinite(longitude) ? longitude.toFixed(8) : f.longitude,
      address: {
        ...f.address,
        ...parsed,
        mapsShareUrl:
          Number.isFinite(latitude) && Number.isFinite(longitude)
            ? googleMapsShareUrl(latitude, longitude, result.display_name)
            : f.address.mapsShareUrl,
      },
    }));
    setLocationQuery(result.display_name || "");
    setLocationResults([]);
    setLocationSearchOpen(false);
    setError("");
  };

  const syncLocationFromCoordinates = async (latitude, longitude) => {
    reverseGeocodeControllerRef.current?.abort();
    const controller = new AbortController();
    reverseGeocodeControllerRef.current = controller;

    try {
      const result = await reverseGeocode(latitude, longitude, controller.signal);
      const nextLocation = result?.display_name;
      if (nextLocation) {
        const parsed = addressFromNominatimResult(result);
        setForm((f) => ({
          ...f,
          location: nextLocation,
          address: {
            ...f.address,
            ...parsed,
            mapsShareUrl: googleMapsShareUrl(latitude, longitude, nextLocation),
          },
        }));
        setLocationQuery(nextLocation);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setError("Unable to resolve the selected map point to an address. You can still search and select a location.");
      }
    }
  };

  useEffect(() => {
    const query = locationQuery.trim();
    if (isMapsShareUrl(query)) {
      setLocationResults([]);
      setLocationSearchLoading(false);
      return undefined;
    }
    if (query.length < 3 || query === form.location.trim()) {
      setLocationResults([]);
      setLocationSearchLoading(false);
      return undefined;
    }

    locationSearchControllerRef.current?.abort();
    const controller = new AbortController();
    locationSearchControllerRef.current = controller;
    setLocationSearchLoading(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const results = await searchLocations(query, controller.signal);
        setLocationResults(results);
        setLocationSearchOpen(true);
      } catch (err) {
        if (err.name !== "AbortError") {
          setLocationResults([]);
          setError("Unable to search locations right now.");
        }
      } finally {
        setLocationSearchLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [form.location, locationQuery]);

  const mapPosition = [
    parseCoordinate(form.latitude, DEFAULT_COORDINATES.lat),
    parseCoordinate(form.longitude, DEFAULT_COORDINATES.lng),
  ];

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Current location is not available in this browser.");
      return;
    }

    setLocationLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateCoordinates(position.coords.latitude, position.coords.longitude);
        void syncLocationFromCoordinates(position.coords.latitude, position.coords.longitude);
        setLocationLoading(false);
      },
      () => {
        setError("Unable to read current location. Choose a point on the map or enter coordinates.");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleConfirm = async () => {
    if (!form.leadId || form.employeeIds.length === 0 || !form.date || !form.time || !form.location) {
      setError(`Select a ${targetType === "lead" ? "lead" : "client"}, at least one staff member, date, time, and location.`);
      return;
    }
    if (!form.propertyType) {
      setError("Select a property type.");
      return;
    }
    if (form.propertyType === "CUSTOM" && !form.propertyTypeCustom.trim()) {
      setError("Enter a custom property type label.");
      return;
    }
    if (!isValidRoomScopes(form.roomScopes)) {
      setError("Add at least one floor with a room, category, and one or more checklist items.");
      return;
    }
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      setError("Choose a valid map location with latitude between -90 and 90 and longitude between -180 and 180.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const visit = await createSiteVisit({
        leadId: form.leadId,
        employeeIds: form.employeeIds,
        scheduledDate: form.date,
        scheduledTime: form.time,
        latitude: form.latitude,
        longitude: form.longitude,
        notes: form.notes || "",
        createdBy: form.employeeIds[0] || null,
        propertyType: form.propertyType,
        propertyTypeCustom: form.propertyTypeCustom,
        roomScopes: form.roomScopes,
        categories: deriveCategoriesFromScopes(form.roomScopes),
        rooms: deriveRoomsFromScopes(form.roomScopes),
      });

      if (visit.uuid) {
        setCreatedVisitUuid(visit.uuid);
        const addr = form.address;
        await addLocationDetails(visit.uuid, {
          addressLine1: addr.addressLine1 || form.location,
          addressLine2: addr.addressLine2 || "",
          city: addr.city || "—",
          state: addr.state || "—",
          country: addr.country || "—",
          pincode: addr.pincode || "—",
          area: addr.area || (targetType === "lead" ? (selectedEntity?.location || "") : ""),
          buildingName: addr.buildingName || (targetType === "lead"
            ? (selectedEntity?.company || selectedEntity?.clientName || "")
            : (selectedEntity?.companyName || selectedEntity?.fullName || "")),
          floor: addr.floor || "",
          unitNumber: addr.unitNumber || "",
          landmark: addr.landmark || "",
          accessNotes: form.notes || "",
          mapsShareUrl: addr.mapsShareUrl || googleMapsShareUrl(latitude, longitude, form.location),
        });
      }

      setConfirmOpen(true);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Unable to schedule site visit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell className="pb-28">
      <PageHeader
        title="Schedule site visit"
        description="Book an on-site inspection with a clear lead, staff assignment, location pin, and checklist workflow."
      />

      {leadPrefillWarning && (
        <div className="rounded-xl border border-amber-200/60 bg-amber-50/60 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          {leadPrefillWarning}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">Visit details</CardTitle>
                <CardDescription>Select lead, time, staff, property type, rooms, checklist items, and location.</CardDescription>
              </div>
              <Badge variant="outline" className="gap-1">
                <Sparkles className="h-3 w-3" />
                Draft schedule
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3 md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Schedule For *</Label>
                  <div className="flex items-center gap-1 rounded-md border border-border bg-muted/30 p-0.5">
                    <button
                      type="button"
                      onClick={() => handleTypeChange("lead")}
                      className={`rounded px-3 py-1 text-xs font-medium transition-all ${
                        targetType === "lead"
                          ? "bg-background shadow text-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Lead
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTypeChange("client")}
                      className={`rounded px-3 py-1 text-xs font-medium transition-all ${
                        targetType === "client"
                          ? "bg-background shadow text-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Client
                    </button>
                  </div>
                </div>

                <Select value={form.leadId} onValueChange={(v) => update("leadId", v)} disabled={loadingOptions}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingOptions ? `Loading ${targetType === "lead" ? "leads" : "clients"}...` : `Select ${targetType === "lead" ? "lead" : "client"}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {targetType === "lead"
                      ? leads.map((lead) => (
                          <SelectItem key={lead.id} value={lead.id}>
                            {lead.clientName}{lead.company ? ` - ${lead.company}` : ""}
                          </SelectItem>
                        ))
                      : clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.fullName} - {client.companyName} (Company ID: {client.companyUuid || "N/A"})
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date *</Label>
                <div className="rounded-lg bg-muted/30 p-3">
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
                        onClick={() => update("date", option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => update("date", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Time *</Label>
                <div className="rounded-lg bg-muted/30 p-3">
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
                        onClick={() => update("time", time)}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
                <Input
                  type="time"
                  value={form.time}
                  onChange={(e) => update("time", e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Assigned staff *</Label>
                <div className="relative">
                  {/* Selected staff chips */}
                  {form.employeeIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2 p-2 rounded-lg bg-muted/30">
                      {selectedEmployees.map((emp) => (
                        <Badge
                          key={emp.id}
                          variant="secondary"
                          className="flex items-center gap-1 pl-2.5 pr-1 py-0.5 text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
                        >
                          <span>
                            {emp.employeeName || emp.fullName}
                            {(emp.roleLabel || ROLE_LABELS[emp.role]) && (
                              <span className="ml-1 text-[10px] text-muted-foreground">
                                · {emp.roleLabel || ROLE_LABELS[emp.role]}
                              </span>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              update("employeeIds", form.employeeIds.filter((id) => id !== Number(emp.id)));
                            }}
                            className="rounded-full p-0.5 hover:bg-muted text-primary/80 hover:text-primary transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Dropdown search and selector trigger */}
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={staffSearchQuery}
                      onChange={(e) => {
                        setStaffSearchQuery(e.target.value);
                        setStaffDropdownOpen(true);
                      }}
                      onFocus={() => setStaffDropdownOpen(true)}
                      onBlur={() => {
                        // Delay closing to let select click register
                        setTimeout(() => setStaffDropdownOpen(false), 250);
                      }}
                      placeholder={form.employeeIds.length > 0 ? "Search to add more staff..." : "Search and select staff..."}
                      className="pl-9 pr-4 bg-background/50 border-border focus-visible:ring-primary"
                    />
                  </div>

                  {/* Dropdown list */}
                  {staffDropdownOpen && (
                    <div className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-md">
                      {filteredEmployees.length > 0 ? (
                        filteredEmployees.map((emp) => {
                          const isSelected = form.employeeIds.includes(Number(emp.id));
                          return (
                            <button
                              key={emp.id}
                              type="button"
                              onMouseDown={(e) => {
                                // Use onMouseDown to trigger before onBlur closes dropdown
                                e.preventDefault();
                                if (isSelected) {
                                  update("employeeIds", form.employeeIds.filter((id) => id !== Number(emp.id)));
                                } else {
                                  update("employeeIds", [...form.employeeIds, Number(emp.id)]);
                                }
                                setStaffSearchQuery("");
                              }}
                              className="flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                            >
                              <span className={isSelected ? "font-semibold text-primary" : ""}>
                                <span className="block">{emp.employeeName || emp.fullName}</span>
                                {(emp.roleLabel || ROLE_LABELS[emp.role] || emp.designation) && (
                                  <span className="block text-[11px] font-normal text-muted-foreground">
                                    {emp.roleLabel || ROLE_LABELS[emp.role] || emp.designation}
                                  </span>
                                )}
                              </span>
                              {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          {loadingOptions
                            ? "Loading staff..."
                            : employees.length === 0
                              ? "No active staff found. Add employees first."
                              : "No matching staff found."}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <RoomChecklistScopeBuilder
                propertyType={form.propertyType}
                propertyTypeCustom={form.propertyTypeCustom}
                roomScopes={form.roomScopes}
                onPropertyTypeChange={(value) => {
                  setForm((f) => ({
                    ...f,
                    propertyType: value,
                    propertyTypeCustom: value === "CUSTOM" ? f.propertyTypeCustom : "",
                  }));
                  setError("");
                }}
                onPropertyTypeCustomChange={(value) => update("propertyTypeCustom", value)}
                onRoomScopesChange={(roomScopes) => update("roomScopes", roomScopes)}
              />

              <div className="space-y-4 md:col-span-2 relative">
                <div className="space-y-2">
                  <Label>Location *</Label>
                  <p className="text-xs text-muted-foreground">
                    Paste a Google Maps link, search an address, or click the map to pin the site.
                  </p>
                  <div className="relative flex gap-2">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={locationQuery}
                        onChange={(e) => {
                          setLocationQuery(e.target.value);
                          setError("");
                          if (!isMapsShareUrl(e.target.value)) {
                            setLocationSearchOpen(true);
                          }
                        }}
                        onFocus={() => {
                          if (locationResults.length) setLocationSearchOpen(true);
                        }}
                        onBlur={() => {
                          window.setTimeout(() => {
                            const trimmed = locationQuery.trim();
                            update("location", trimmed);
                            setLocationSearchOpen(false);
                            if (isMapsShareUrl(trimmed)) {
                              void resolveLocationFromQuery(trimmed);
                            }
                          }, 150);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void resolveLocationFromQuery(locationQuery);
                          }
                        }}
                        placeholder="Google Maps link, street address, or area"
                        className="pl-9 pr-9"
                      />
                      {locationSearchLoading ? (
                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void resolveLocationFromQuery(locationQuery)}
                      disabled={locationSearchLoading || !locationQuery.trim()}
                    >
                      Look up
                    </Button>
                  </div>

                  {locationSearchOpen && !isMapsShareUrl(locationQuery) && (locationResults.length > 0 || locationQuery.trim().length >= 3) ? (
                    <div className="absolute z-30 mt-2 max-h-72 w-full max-w-xl overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-md">
                      {locationResults.length ? (
                        locationResults.map((result) => (
                          <button
                            key={`${result.place_id}-${result.lat}-${result.lon}`}
                            type="button"
                            className="flex w-full items-start justify-between gap-3 rounded-sm px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              applyLocationSelection(result);
                            }}
                          >
                            <span className="line-clamp-2">{result.display_name}</span>
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          No matching locations found. Try Look up for Google Maps links.
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 sm:grid-cols-2">
                  <p className="sm:col-span-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Address details
                  </p>
                  <div className="space-y-2">
                    <Label>Street / building</Label>
                    <Input
                      value={form.address.addressLine1}
                      onChange={(e) => updateAddress("addressLine1", e.target.value)}
                      placeholder="Street name or building"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Villa / unit no.</Label>
                    <Input
                      value={form.address.unitNumber}
                      onChange={(e) => updateAddress("unitNumber", e.target.value)}
                      placeholder="e.g. Villa 12, Unit 4B"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Building / community</Label>
                    <Input
                      value={form.address.buildingName}
                      onChange={(e) => updateAddress("buildingName", e.target.value)}
                      placeholder="Tower, compound, or project name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Floor</Label>
                    <Input
                      value={form.address.floor}
                      onChange={(e) => updateAddress("floor", e.target.value)}
                      placeholder="e.g. Ground, 3, Penthouse"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Area / suburb</Label>
                    <Input
                      value={form.address.area}
                      onChange={(e) => updateAddress("area", e.target.value)}
                      placeholder="Suburb or district"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Landmark</Label>
                    <Input
                      value={form.address.landmark}
                      onChange={(e) => updateAddress("landmark", e.target.value)}
                      placeholder="Near mall, mosque, park..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={form.address.city}
                      onChange={(e) => updateAddress("city", e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input
                      value={form.address.state}
                      onChange={(e) => updateAddress("state", e.target.value)}
                      placeholder="State / emirate"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Postcode</Label>
                    <Input
                      value={form.address.pincode}
                      onChange={(e) => updateAddress("pincode", e.target.value)}
                      placeholder="Postcode"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input
                      value={form.address.country}
                      onChange={(e) => updateAddress("country", e.target.value)}
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input
                  type="number"
                  step="0.00000001"
                  value={form.latitude}
                  onChange={(e) => update("latitude", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Longitude *</Label>
                <Input
                  type="number"
                  step="0.00000001"
                  value={form.longitude}
                  onChange={(e) => update("longitude", e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  rows={4}
                  placeholder="Site access notes, parking instructions, and client preferences..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 xl:sticky xl:top-6 xl:z-10 xl:max-h-[calc(100dvh-10rem)] xl:self-start xl:overflow-y-auto xl:overscroll-y-contain xl:pr-1">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Navigation2 className="h-4 w-4 text-primary" />
                    Location pin
                  </CardTitle>
                  <CardDescription>Click the map to set the inspection coordinates.</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={useCurrentLocation}
                  disabled={locationLoading}
                >
                  <Crosshair className="h-3.5 w-3.5" />
                  {locationLoading ? "Locating" : "Use current"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg bg-muted/20">
                <MapContainer
                  center={mapPosition}
                  zoom={13}
                  scrollWheelZoom
                  className="h-72 w-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationPickerMap
                    position={mapPosition}
                    onChange={(latitude, longitude) => {
                      updateCoordinates(latitude, longitude);
                      void syncLocationFromCoordinates(latitude, longitude);
                    }}
                  />
                </MapContainer>
              </div>
              <div className="mt-3 rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">{form.location || "Site location pending"}</p>
                    <p className="mt-1 font-mono">
                      {form.latitude}, {form.longitude}
                    </p>
                    {(form.address.mapsShareUrl || form.location) && (
                      <a
                        href={
                          form.address.mapsShareUrl
                          || googleMapsShareUrl(form.latitude, form.longitude, form.location)
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex text-xs font-medium text-primary hover:underline"
                      >
                        Open in Google Maps
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
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
                Choose a lead and fill in the details to schedule a site inspection.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/95 p-4 backdrop-blur md:left-[var(--sidebar-width)]">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-destructive">{error}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button variant="outline" asChild>
            <Link to={ROUTES.ADMIN.SITE_VISITS}>Cancel</Link>
          </Button>
          <Button onClick={handleConfirm} className="gap-2" disabled={submitting || loadingOptions}>
            <ShieldCheck className="h-4 w-4" />
            {submitting ? "Scheduling..." : "Confirm schedule"}
          </Button>
          </div>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Visit scheduled</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="space-y-1 text-muted-foreground">
              <p>
                {targetType === "lead"
                  ? `${selectedLead?.clientName || "Lead"} - ${selectedLead?.company || "Company"}`
                  : `${selectedClient?.fullName || "Client"} - ${selectedClient?.companyName || "Company"}`}
              </p>
              <p>
                {form.date || "Date pending"} at {form.time || "Time pending"}
              </p>
              <p>
                Assigned to {selectedEmployees.map((e) => e.employeeName || e.fullName).join(", ") || "staff"}.
              </p>
            </div>

            {form.roomScopes.length > 0 && (
              <div className="rounded-xl bg-muted/30 p-3 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Renovation checklist scope
                </p>
                <p className="text-sm">
                  {form.propertyType === "CUSTOM"
                    ? form.propertyTypeCustom || "Custom"
                    : form.propertyType
                      ? form.propertyType.charAt(0) + form.propertyType.slice(1).toLowerCase()
                      : "—"}
                  {" · "}
                  {form.roomScopes.length} floor{form.roomScopes.length === 1 ? "" : "s"}
                  {" · "}
                  {countScopedRooms(form.roomScopes)} room
                  {countScopedRooms(form.roomScopes) === 1 ? "" : "s"}
                  {" · "}
                  {countScopedItems(form.roomScopes)} item
                  {countScopedItems(form.roomScopes) === 1 ? "" : "s"}
                </p>
                <ul className="space-y-1">
                  {form.roomScopes.map((floor) => (
                    <li key={floor.floorName} className="flex items-start gap-2 text-sm">
                      <CheckSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>
                        {floor.floorName}
                        {(floor.rooms || []).length > 0
                          ? ` — ${(floor.rooms || []).map((r) => r.roomName).join(", ")}`
                          : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Keep editing
            </Button>
            {createdVisitUuid ? (
              <Button
                onClick={() =>
                  navigate(ROUTES.ADMIN.SITE_VISIT_REPORT.replace(":visitId", createdVisitUuid))
                }
              >
                Open visit detail
              </Button>
            ) : (
              <Button onClick={() => navigate(ROUTES.ADMIN.SITE_VISITS)}>View visits</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
