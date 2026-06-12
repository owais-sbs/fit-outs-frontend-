import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Check, Clock3, Crosshair, Loader2, MapPin, Navigation2, Search, ShieldCheck, Sparkles } from "lucide-react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { ROUTES } from "@/shared/constants/routes";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { fetchAllLeads } from "../api/leads.api";
import { fetchAllEmployees } from "../api/employees.api";
import { createSiteVisit, addLocationDetails } from "../api/site-visits.api";
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
  const locationSearchControllerRef = useRef(null);
  const reverseGeocodeControllerRef = useRef(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
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
    staff: "",
    date: "",
    time: "",
    location: "",
    latitude: "-33.868820",
    longitude: "151.209290",
    notes: "",
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchAllLeads(),
      fetchAllEmployees().catch(() => []),
    ])
      .then(([leadList, empList]) => {
        if (cancelled) return;
        setLeads(leadList);
        setEmployees(empList.filter((e) => e.isActive));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.response?.data?.error || err.response?.data?.message || "Unable to load options");
      })
      .finally(() => {
        if (!cancelled) setLoadingOptions(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setLocationQuery(form.location);
  }, [form.location]);

  const selectedLead = leads.find((l) => l.id === form.leadId);
  const selectedEmployee = employees.find((e) => String(e.id) === String(form.staff));

  const summaryItems = useMemo(
    () => [
      {
        label: "Lead",
        value: selectedLead ? `${selectedLead.clientName}` : "Select a lead",
      },
      { label: "Date", value: form.date || "Pending" },
      { label: "Time", value: form.time || "Pending" },
      { label: "Staff", value: selectedEmployee?.employeeName || "Assign staff" },
    ],
    [form.date, form.time, selectedLead, selectedEmployee]
  );

  const update = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
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
    setForm((f) => ({
      ...f,
      location: result.display_name || f.location,
      latitude: Number.isFinite(latitude) ? latitude.toFixed(8) : f.latitude,
      longitude: Number.isFinite(longitude) ? longitude.toFixed(8) : f.longitude,
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
        setForm((f) => ({ ...f, location: nextLocation }));
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
    if (!form.leadId || !form.staff || !form.date || !form.time || !form.location) {
      setError("Select a lead, staff member, date, time, and location.");
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
        assignedTo: form.staff,
        scheduledDate: form.date,
        scheduledTime: form.time,
        latitude: form.latitude,
        longitude: form.longitude,
        notes: form.notes || "",
        createdBy: form.staff,
      });

      if (visit.uuid) {
        const [addressLine1, ...rest] = form.location.split(",").map((part) => part.trim()).filter(Boolean);
        await addLocationDetails(visit.uuid, {
          addressLine1: addressLine1 || form.location,
          addressLine2: rest.join(", "),
          city: "Sydney",
          state: "NSW",
          country: "Australia",
          pincode: "2000",
          area: selectedLead?.location || "",
          buildingName: selectedLead?.company || selectedLead?.clientName || "",
          accessNotes: form.notes || "",
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
                <Select value={form.leadId} onValueChange={(v) => update("leadId", v)} disabled={loadingOptions}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingOptions ? "Loading leads..." : "Select lead"} />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.clientName}{lead.company ? ` - ${lead.company}` : ""}
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

              <div className="space-y-2">
                <Label>Assigned staff *</Label>
                <Select value={form.staff} onValueChange={(v) => update("staff", v)} disabled={loadingOptions}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingOptions ? "Loading staff..." : "Select staff member"} />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.employeeName || emp.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Location *</Label>
                <div className="relative">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={locationQuery}
                      onChange={(e) => {
                        setLocationQuery(e.target.value);
                        setError("");
                        setLocationSearchOpen(true);
                      }}
                      onFocus={() => {
                        if (locationResults.length) setLocationSearchOpen(true);
                      }}
                      onBlur={() => {
                        window.setTimeout(() => {
                          update("location", locationQuery.trim());
                          setLocationSearchOpen(false);
                        }, 150);
                      }}
                      placeholder="Search street address, building, or area"
                      className="pl-9 pr-9"
                    />
                    {locationSearchLoading ? (
                      <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    ) : null}
                  </div>

                  {locationSearchOpen && (locationResults.length > 0 || locationQuery.trim().length >= 3) ? (
                    <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-md">
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
                          No matching locations found.
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Latitude *</Label>
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

        <div className="space-y-6">
          <Card className="sticky top-6 border-border/60 shadow-sm">
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
              <div className="overflow-hidden rounded-lg border border-border/60">
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
              <div className="mt-3 rounded-lg border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">{form.location || "Site location pending"}</p>
                    <p className="mt-1 font-mono">
                      {form.latitude}, {form.longitude}
                    </p>
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
              Assigned to {selectedEmployee?.employeeName || "staff"}.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Keep editing
            </Button>
            <Button onClick={() => navigate(ROUTES.ADMIN.SITE_VISITS)}>View visits</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
