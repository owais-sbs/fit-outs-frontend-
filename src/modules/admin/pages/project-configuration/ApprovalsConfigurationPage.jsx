import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Pencil, Search, Trash2 } from "lucide-react";
import ConfigurationLayout from "../../components/shared/configuration/ConfigurationLayout";
import PageHeader from "../../components/shared/configuration/PageHeader";
import MasterFormModal from "../../components/shared/configuration/MasterFormModal";
import DeleteConfirmationModal from "../../components/shared/configuration/DeleteConfirmationModal";
import EmptyState from "../../components/shared/configuration/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createAuthority,
  createDocumentType,
  createJurisdictionPack,
  createPermitType,
  deleteAuthority,
  deleteDocumentType,
  deleteJurisdictionPack,
  deletePermitType,
  deleteScopeTag,
  fetchApprovalsCatalog,
  updateAuthority,
  updateDocumentType,
  updateJurisdictionPack,
  updatePermitType,
  updateScopeTag,
  createScopeTag,
  createPropertyType,
  createProjectNature,
  createCompanyRegistration,
  deletePropertyType,
  deleteProjectNature,
  deleteCompanyRegistration,
  updatePropertyType,
  updateProjectNature,
  updateCompanyRegistration,
} from "../../api/approvals-config.api";

const TABS = [
  { id: "authorities", label: "Authorities" },
  { id: "permits", label: "Permit types" },
  { id: "documents", label: "Documents" },
  { id: "scopeTags", label: "Scope tags" },
  { id: "propertyTypes", label: "Property types" },
  { id: "projectNatures", label: "Project nature" },
  { id: "registrations", label: "Company registrations" },
  { id: "packs", label: "Jurisdiction packs" },
];

const TRIGGER_TYPES = [
  { value: "SCOPE_TAG", label: "Scope tag" },
  { value: "LOCATION", label: "Location only" },
  { value: "PROPERTY_PROJECT", label: "Property or project type" },
  { value: "PREREQUISITE", label: "Follows a prerequisite" },
  { value: "COMPANY", label: "Company-level" },
];

const TRIGGER_LABEL = Object.fromEntries(TRIGGER_TYPES.map((t) => [t.value, t.label]));

const REGISTRATION_STATUSES = ["Active", "Pending", "Expired", "Inactive"];

const INCLUSION_LABEL = {
  ALWAYS: "Always",
  OPTIONAL_KITCHEN: "If commercial kitchen",
  OPTIONAL_SIRA: "If CCTV / access control",
  OPTIONAL_RTA: "If public-road works",
  OPTIONAL_DEMO: "If demolition",
  OPTIONAL_LOAD: "If load upgrade",
};

function matches(term, ...values) {
  const q = term.trim().toLowerCase();
  if (!q) return true;
  return values.some((v) => String(v || "").toLowerCase().includes(q));
}

export default function ApprovalsConfigurationPage() {
  const [tab, setTab] = useState("authorities");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [authorities, setAuthorities] = useState([]);
  const [permits, setPermits] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [scopeTags, setScopeTags] = useState([]);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [projectNatures, setProjectNatures] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [packs, setPacks] = useState([]);
  const [expandedPacks, setExpandedPacks] = useState(new Set());

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const showToast = (type, title, message) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const catalog = await fetchApprovalsCatalog();
      setAuthorities(Array.isArray(catalog?.authorities) ? catalog.authorities : []);
      setPermits(Array.isArray(catalog?.permitTypes) ? catalog.permitTypes : []);
      setDocuments(Array.isArray(catalog?.documentTypes) ? catalog.documentTypes : []);
      setScopeTags(Array.isArray(catalog?.scopeTags) ? catalog.scopeTags : []);
      setPropertyTypes(Array.isArray(catalog?.propertyTypes) ? catalog.propertyTypes : []);
      setProjectNatures(Array.isArray(catalog?.projectNatures) ? catalog.projectNatures : []);
      setRegistrations(Array.isArray(catalog?.companyRegistrations) ? catalog.companyRegistrations : []);
      setPacks(Array.isArray(catalog?.packs) ? catalog.packs : []);
    } catch (err) {
      const detail =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Could not load approvals catalog.";
      showToast("error", "Load failed", detail);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredAuthorities = useMemo(
    () => authorities.filter((item) => matches(search, item.code, item.name, item.type, item.emirate)),
    [authorities, search]
  );
  const filteredPermits = useMemo(
    () => permits.filter((item) => matches(search, item.permitCode, item.name, item.issuingBody)),
    [permits, search]
  );
  const filteredDocuments = useMemo(
    () => documents.filter((item) => matches(search, item.docCode, item.name, item.category)),
    [documents, search]
  );
  const filteredScopeTags = useMemo(
    () => scopeTags.filter((item) => matches(search, item.code, item.name, item.description)),
    [scopeTags, search]
  );
  const filteredPropertyTypes = useMemo(
    () => propertyTypes.filter((item) => matches(search, item.code, item.name, item.description)),
    [propertyTypes, search]
  );
  const filteredProjectNatures = useMemo(
    () => projectNatures.filter((item) => matches(search, item.code, item.name, item.description)),
    [projectNatures, search]
  );
  const filteredRegistrations = useMemo(
    () => registrations.filter((item) => matches(search, item.authorityCode, item.authorityName, item.referenceNo, item.status)),
    [registrations, search]
  );
  const filteredPacks = useMemo(
    () => packs.filter((item) => matches(search, item.code, item.name, item.primaryAuthorityName, item.communityAuthorityName)),
    [packs, search]
  );

  const openCreate = () => {
    setFormMode("create");
    setEditing(null);
    if (tab === "authorities") setForm({ code: "", name: "", type: "Regulator", emirate: "Dubai", jurisdictionAreas: "", permitsIssued: "", submissionChannel: "", notes: "", requiresCompanyRegistration: false, active: true });
    if (tab === "permits") setForm({ permitCode: "", name: "", issuingBody: "", triggerType: "SCOPE_TAG", typicalTrigger: "", prerequisiteCases: "", slaWorkingDays: "", typicalValidity: "", deposit: "No", renewable: "Yes", blocksActivities: "", active: true, scopeTagIds: [], propertyTypeIds: [], projectNatureIds: [] });
    if (tab === "documents") setForm({ docCode: "", name: "", category: "Company", typicallyRequiredFor: "", expiryTracked: false, sourceOwner: "Contractor", active: true });
    if (tab === "scopeTags") setForm({ code: "", name: "", description: "", active: true, permitTypeIds: [] });
    if (tab === "propertyTypes") setForm({ code: "", name: "", description: "", active: true, permitTypeIds: [] });
    if (tab === "projectNatures") setForm({ code: "", name: "", description: "", active: true, permitTypeIds: [] });
    if (tab === "registrations") setForm({ authorityId: "", referenceNo: "", registrationDate: "", renewalDate: "", status: "Active", notes: "", active: true });
    if (tab === "packs") {
      setForm({
        code: "",
        name: "",
        description: "",
        communityAuthorityId: "",
        primaryAuthorityId: "",
        selectable: true,
        active: true,
        permitTypeIds: permits.filter((p) => p.active !== false).map((p) => p.id),
      });
    }
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setFormMode("edit");
    setEditing(row);
    if (tab === "packs") {
      setForm({
        code: row.code,
        name: row.name,
        description: row.description || "",
        communityAuthorityId: row.communityAuthorityId || "",
        primaryAuthorityId: row.primaryAuthorityId || "",
        selectable: row.selectable !== false,
        active: row.active !== false,
      });
    } else if (tab === "permits") {
      setForm({
        ...row,
        triggerType: row.triggerType || "SCOPE_TAG",
        scopeTagIds: Array.isArray(row.scopeTagIds) ? row.scopeTagIds : (row.scopeTags || []).map((t) => t.id),
        propertyTypeIds: Array.isArray(row.propertyTypeIds) ? row.propertyTypeIds : (row.propertyTypes || []).map((t) => t.id),
        projectNatureIds: Array.isArray(row.projectNatureIds) ? row.projectNatureIds : (row.projectNatures || []).map((t) => t.id),
      });
    } else if (tab === "scopeTags" || tab === "propertyTypes" || tab === "projectNatures") {
      setForm({
        ...row,
        permitTypeIds: Array.isArray(row.permitTypeIds) ? row.permitTypeIds : (row.triggeredPermits || []).map((p) => p.id),
      });
    } else if (tab === "registrations") {
      setForm({
        ...row,
        authorityId: row.authorityId || "",
        registrationDate: row.registrationDate || "",
        renewalDate: row.renewalDate || "",
        status: row.status || "Active",
      });
    } else {
      setForm({ ...row });
    }
    setFormOpen(true);
  };

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleId = (key, id, checked) => {
    setForm((prev) => {
      const current = Array.isArray(prev[key]) ? prev[key] : [];
      return {
        ...prev,
        [key]: checked ? [...current.filter((x) => x !== id), id] : current.filter((x) => x !== id),
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (tab === "authorities") {
        const payload = { ...form };
        if (formMode === "create") await createAuthority(payload);
        else await updateAuthority(editing.id, payload);
      } else if (tab === "permits") {
        const triggerType = form.triggerType || "SCOPE_TAG";
        const payload = {
          ...form,
          triggerType,
          scopeTagIds: triggerType === "SCOPE_TAG" ? (form.scopeTagIds || []) : [],
          propertyTypeIds: triggerType === "PROPERTY_PROJECT" ? (form.propertyTypeIds || []) : [],
          projectNatureIds: triggerType === "PROPERTY_PROJECT" ? (form.projectNatureIds || []) : [],
        };
        if (formMode === "create") await createPermitType(payload);
        else await updatePermitType(editing.id, payload);
      } else if (tab === "documents") {
        if (formMode === "create") await createDocumentType(form);
        else await updateDocumentType(editing.id, form);
      } else if (tab === "scopeTags") {
        const payload = {
          ...form,
          permitTypeIds: form.permitTypeIds || [],
        };
        if (formMode === "create") await createScopeTag(payload);
        else await updateScopeTag(editing.id, payload);
      } else if (tab === "propertyTypes") {
        const payload = { ...form, permitTypeIds: form.permitTypeIds || [] };
        if (formMode === "create") await createPropertyType(payload);
        else await updatePropertyType(editing.id, payload);
      } else if (tab === "projectNatures") {
        const payload = { ...form, permitTypeIds: form.permitTypeIds || [] };
        if (formMode === "create") await createProjectNature(payload);
        else await updateProjectNature(editing.id, payload);
      } else if (tab === "registrations") {
        const payload = {
          ...form,
          authorityId: form.authorityId || null,
          registrationDate: form.registrationDate || null,
          renewalDate: form.renewalDate || null,
        };
        if (formMode === "create") await createCompanyRegistration(payload);
        else await updateCompanyRegistration(editing.id, payload);
      } else if (tab === "packs") {
        if (formMode === "create") {
          await createJurisdictionPack({
            ...form,
            communityAuthorityId: form.communityAuthorityId || null,
            primaryAuthorityId: form.primaryAuthorityId || null,
            permits: (form.permitTypeIds || []).map((id, index) => ({
              permitTypeId: id,
              inclusionRule: "ALWAYS",
              sortOrder: index,
            })),
          });
        } else {
          await updateJurisdictionPack(editing.id, {
            code: form.code,
            name: form.name,
            description: form.description,
            communityAuthorityId: form.communityAuthorityId || null,
            primaryAuthorityId: form.primaryAuthorityId || null,
            selectable: form.selectable,
            active: form.active,
          });
        }
      }
      setFormOpen(false);
      showToast("success", "Saved", "Catalog updated.");
      await load();
    } catch (err) {
      showToast("error", "Save failed", err.response?.data?.error || err.message || "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (tab === "authorities") await deleteAuthority(deleteTarget.id);
      if (tab === "permits") await deletePermitType(deleteTarget.id);
      if (tab === "documents") await deleteDocumentType(deleteTarget.id);
      if (tab === "scopeTags") await deleteScopeTag(deleteTarget.id);
      if (tab === "propertyTypes") await deletePropertyType(deleteTarget.id);
      if (tab === "projectNatures") await deleteProjectNature(deleteTarget.id);
      if (tab === "registrations") await deleteCompanyRegistration(deleteTarget.id);
      if (tab === "packs") await deleteJurisdictionPack(deleteTarget.id);
      setDeleteTarget(null);
      showToast("success", "Deleted", "Record removed.");
      await load();
    } catch (err) {
      showToast("error", "Delete failed", err.response?.data?.error || err.message);
    }
  };

  const togglePack = (id) => {
    setExpandedPacks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const actionLabel = {
    authorities: "Add authority",
    permits: "Add permit type",
    documents: "Add document",
    scopeTags: "Add scope tag",
    propertyTypes: "Add property type",
    projectNatures: "Add project nature",
    registrations: "Add registration",
    packs: "Add jurisdiction pack",
  }[tab];

  return (
    <ConfigurationLayout>
      {toast && (
        <div className={`rounded-xl px-3 py-2 text-sm ring-1 ${toast.type === "error" ? "bg-destructive/10 text-destructive ring-destructive/20" : "bg-emerald-500/10 text-emerald-800 ring-emerald-500/20"}`}>
          <span className="font-medium">{toast.title}.</span> {toast.message}
        </div>
      )}
      <PageHeader
        title="Approvals Config"
        description="Authority, permit, document, classifier and company-registration libraries used when generating approval cases."
        actionLabel={actionLabel}
        onAction={openCreate}
      />

      <Tabs value={tab} onValueChange={(value) => { setTab(value); setSearch(""); }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="flex-wrap h-auto">
            {TABS.map((item) => (
              <TabsTrigger key={item.id} value={item.id}>{item.label}</TabsTrigger>
            ))}
          </TabsList>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 h-9" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <TabsContent value="authorities" className="mt-4">
          {loading ? <Skeleton className="h-48 w-full" /> : filteredAuthorities.length === 0 ? (
            <EmptyState title="No authorities" description="Seeded Dubai authorities will appear here after first load." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Authority</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Emirate</TableHead>
                  <TableHead>Registration</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Company reg.</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAuthorities.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">{row.code}</TableCell>
                    <TableCell>
                      <div className="font-medium">{row.name}</div>
                      {row.jurisdictionAreas && <p className="text-xs text-muted-foreground line-clamp-2">{row.jurisdictionAreas}</p>}
                    </TableCell>
                    <TableCell><Badge variant="outline">{row.type}</Badge></TableCell>
                    <TableCell>{row.emirate}</TableCell>
                    <TableCell className="text-xs">{row.requiresCompanyRegistration ? "Required" : "—"}</TableCell>
                    <TableCell className="text-xs">{row.submissionChannel}</TableCell>
                    <TableCell className="text-xs">{row.requiresCompanyRegistration ? "Required" : "—"}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(row)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="permits" className="mt-4">
          {loading ? <Skeleton className="h-48 w-full" /> : filteredPermits.length === 0 ? (
            <EmptyState title="No permit types" description="Generic permit cases such as fit-out, DCD NOC and community works permit." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Case type</TableHead>
                  <TableHead>Issuer</TableHead>
                  <TableHead>Triggered by</TableHead>
                  <TableHead>SLA (wd)</TableHead>
                  <TableHead>Blocks</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPermits.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">{row.permitCode}</TableCell>
                    <TableCell>
                      <div className="font-medium">{row.name}</div>
                      {row.typicalTrigger && <p className="text-xs text-muted-foreground line-clamp-2">{row.typicalTrigger}</p>}
                    </TableCell>
                    <TableCell className="text-xs">{row.issuingBody}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline">{TRIGGER_LABEL[row.triggerType] || row.triggerType || "Scope tag"}</Badge>
                        {row.triggerType === "SCOPE_TAG" && (
                          <TagList items={(row.scopeTags || []).map((t) => t.name)} empty="No tags linked" />
                        )}
                        {row.triggerType === "PROPERTY_PROJECT" && (
                          <TagList
                            items={[
                              ...(row.propertyTypes || []).map((t) => t.name),
                              ...(row.projectNatures || []).map((t) => t.name),
                            ]}
                            empty="No property/nature linked"
                          />
                        )}
                        {row.triggerType === "PREREQUISITE" && row.missingPrerequisite && (
                          <p className="text-[11px] text-amber-700">No prerequisite linked</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{row.slaWorkingDays}</TableCell>
                    <TableCell className="text-xs max-w-xs">{row.blocksActivities}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(row)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          {loading ? <Skeleton className="h-48 w-full" /> : filteredDocuments.length === 0 ? (
            <EmptyState title="No document types" description="Submission checklist items required by authorities." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">{row.docCode}</TableCell>
                    <TableCell>
                      <div className="font-medium">{row.name}</div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{row.typicallyRequiredFor}</p>
                    </TableCell>
                    <TableCell>{row.category}</TableCell>
                    <TableCell className="text-xs">{row.sourceOwner}</TableCell>
                    <TableCell>{row.expiryTracked ? "Tracked" : "No"}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(row)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="scopeTags" className="mt-4">
          {loading ? <Skeleton className="h-48 w-full" /> : filteredScopeTags.length === 0 ? (
            <EmptyState title="No scope tags" description="Tags that describe which kinds of work trigger approvals." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Triggers permits</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredScopeTags.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">{row.code}</TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>
                      <TagList items={(row.triggeredPermits || []).map((p) => p.permitCode)} empty="None" />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-md">{row.description}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(row)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="propertyTypes" className="mt-4">
          {loading ? <Skeleton className="h-48 w-full" /> : filteredPropertyTypes.length === 0 ? (
            <EmptyState title="No property types" description="Villa, apartment, commercial shell and similar classifiers. Independent of projects.project_type." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Used by permits</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPropertyTypes.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">{row.code}</TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>
                      <TagList items={(row.triggeredPermits || []).map((p) => p.permitCode)} empty="None" />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-md">{row.description}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(row)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="projectNatures" className="mt-4">
          {loading ? <Skeleton className="h-48 w-full" /> : filteredProjectNatures.length === 0 ? (
            <EmptyState title="No project natures" description="New build, major refurbishment, renovation, fit-out." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Used by permits</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjectNatures.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">{row.code}</TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>
                      <TagList items={(row.triggeredPermits || []).map((p) => p.permitCode)} empty="None" />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-md">{row.description}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(row)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="registrations" className="mt-4">
          {loading ? <Skeleton className="h-48 w-full" /> : filteredRegistrations.length === 0 ? (
            <EmptyState title="No company registrations" description="One-time contractor registrations with an authority, attached to this contracting company." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Authority</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Renewal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{row.authorityName}</div>
                      <div className="font-mono text-xs text-muted-foreground">{row.authorityCode}</div>
                    </TableCell>
                    <TableCell className="text-xs">{row.referenceNo || "—"}</TableCell>
                    <TableCell className="text-xs">{row.registrationDate || "—"}</TableCell>
                    <TableCell className="text-xs">{row.renewalDate || "—"}</TableCell>
                    <TableCell><Badge variant="outline">{row.status}</Badge></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(row)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="packs" className="mt-4 space-y-2">
          {loading ? <Skeleton className="h-48 w-full" /> : filteredPacks.length === 0 ? (
            <EmptyState title="No jurisdiction packs" description="Packs map a community or zone to the authorities and permits that apply." />
          ) : filteredPacks.map((pack) => {
            const open = expandedPacks.has(pack.id);
            return (
              <div key={pack.id} className="rounded-xl border bg-card">
                <div className="flex items-start gap-3 p-4">
                  <Button size="icon" variant="ghost" className="mt-0.5" onClick={() => togglePack(pack.id)}>
                    {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{pack.name}</span>
                      <Badge variant="outline" className="font-mono text-[10px]">{pack.code}</Badge>
                      {pack.selectable === false && <Badge variant="secondary">Hidden</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{pack.description}</p>
                    <p className="text-xs mt-2">
                      Community: <span className="font-medium">{pack.communityAuthorityName || "—"}</span>
                      {" · "}Primary: <span className="font-medium">{pack.primaryAuthorityName || "—"}</span>
                      {" · "}{pack.permits?.length || 0} permit cases
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(pack)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(pack)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                {open && (
                  <div className="border-t px-4 py-3 space-y-2">
                    {(pack.permits || []).map((permit) => (
                      <div key={permit.id} className="rounded-lg bg-muted/40 px-3 py-2">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="font-mono text-xs">{permit.permitCode}</span>
                          <span className="font-medium">{permit.permitName}</span>
                          <Badge variant="outline">{INCLUSION_LABEL[permit.inclusionRule] || permit.inclusionRule}</Badge>
                          {permit.issuingAuthorityName && <span className="text-xs text-muted-foreground">{permit.issuingAuthorityName}</span>}
                        </div>
                        {permit.documents?.length > 0 && (
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Docs: {permit.documents.map((d) => d.docCode).join(", ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </TabsContent>
      </Tabs>

      <MasterFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === "create" ? actionLabel : "Edit record"}
        description="Fees and SLAs in the seed data are indicative."
        className="sm:max-w-[640px]"
      >
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          {tab === "authorities" && (
            <>
              <Field label="Code" value={form.code} onChange={(v) => setField("code", v)} />
              <Field label="Name" value={form.name} onChange={(v) => setField("name", v)} />
              <div className="grid grid-cols-2 gap-3">
                <SelectField label="Type" value={form.type} onChange={(v) => setField("type", v)} options={["Regulator", "Utility", "Master Developer", "Building Management"]} />
                <Field label="Emirate" value={form.emirate} onChange={(v) => setField("emirate", v)} />
              </div>
              <Field label="Submission channel" value={form.submissionChannel} onChange={(v) => setField("submissionChannel", v)} />
              <Area label="Jurisdiction areas" value={form.jurisdictionAreas} onChange={(v) => setField("jurisdictionAreas", v)} />
              <Area label="Permits issued" value={form.permitsIssued} onChange={(v) => setField("permitsIssued", v)} />
              <Area label="Notes" value={form.notes} onChange={(v) => setField("notes", v)} />
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div>
                  <Label>Requires company-level registration</Label>
                  <p className="text-[11px] text-muted-foreground">Contractor must be registered with this authority once, not per project.</p>
                </div>
                <Switch checked={!!form.requiresCompanyRegistration} onCheckedChange={(v) => setField("requiresCompanyRegistration", v)} />
              </div>
            </>
          )}
          {tab === "permits" && (
            <>
              <Field label="Permit code" value={form.permitCode} onChange={(v) => setField("permitCode", v)} />
              <Field label="Name" value={form.name} onChange={(v) => setField("name", v)} />
              <Field label="Issuing body" value={form.issuingBody} onChange={(v) => setField("issuingBody", v)} />
              <SelectField
                label="Trigger type"
                value={form.triggerType || "SCOPE_TAG"}
                onChange={(v) => setField("triggerType", v)}
                options={TRIGGER_TYPES}
              />
              {form.triggerType === "LOCATION" && (
                <p className="text-[11px] text-muted-foreground rounded-lg border px-3 py-2">
                  Applies because the project sits in a jurisdiction covered by this permit's authority. No work-item or property condition is needed.
                </p>
              )}
              {form.triggerType === "COMPANY" && (
                <p className="text-[11px] text-muted-foreground rounded-lg border px-3 py-2">
                  Company-level, not a project case. Record the contractor registration under the Company registrations tab.
                </p>
              )}
              {form.triggerType === "PREREQUISITE" && !String(form.prerequisiteCases || "").trim() && (
                <p className="text-[11px] text-amber-800 bg-amber-50 rounded-lg border border-amber-200 px-3 py-2">
                  This trigger type needs at least one prerequisite permit linked below.
                </p>
              )}
              <Field label="SLA (working days)" value={form.slaWorkingDays} onChange={(v) => setField("slaWorkingDays", v)} />
              <Field label="Validity" value={form.typicalValidity} onChange={(v) => setField("typicalValidity", v)} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Deposit" value={form.deposit} onChange={(v) => setField("deposit", v)} />
                <Field label="Renewable" value={form.renewable} onChange={(v) => setField("renewable", v)} />
              </div>
              <Area label="Typical trigger" value={form.typicalTrigger} onChange={(v) => setField("typicalTrigger", v)} />
              {(!form.triggerType || form.triggerType === "SCOPE_TAG") && (
                <CheckList
                  label="Triggered by scope tags"
                  hint="If a project's work items carry any of these tags, this permit applies."
                  items={scopeTags}
                  selectedIds={form.scopeTagIds || []}
                  idKey="id"
                  primary={(t) => t.name}
                  secondary={(t) => t.code}
                  description={(t) => t.description}
                  onToggle={(id, checked) => toggleId("scopeTagIds", id, checked)}
                  empty="No scope tags yet. Add them under the Scope tags tab first."
                />
              )}
              {form.triggerType === "PROPERTY_PROJECT" && (
                <>
                  <CheckList
                    label="Property types"
                    hint="If linked, the project must match one of these. Leave empty if property type does not matter."
                    items={propertyTypes}
                    selectedIds={form.propertyTypeIds || []}
                    idKey="id"
                    primary={(t) => t.name}
                    secondary={(t) => t.code}
                    description={(t) => t.description}
                    onToggle={(id, checked) => toggleId("propertyTypeIds", id, checked)}
                    empty="No property types yet."
                  />
                  <CheckList
                    label="Project natures"
                    hint="If linked, the project must match one of these. If both lists have values, the project must match one from each."
                    items={projectNatures}
                    selectedIds={form.projectNatureIds || []}
                    idKey="id"
                    primary={(t) => t.name}
                    secondary={(t) => t.code}
                    description={(t) => t.description}
                    onToggle={(id, checked) => toggleId("projectNatureIds", id, checked)}
                    empty="No project natures yet."
                  />
                </>
              )}
              <Area label="Prerequisites" value={form.prerequisiteCases} onChange={(v) => setField("prerequisiteCases", v)} />
              <Area label="Blocks activities" value={form.blocksActivities} onChange={(v) => setField("blocksActivities", v)} />
            </>
          )}
          {tab === "documents" && (
            <>
              <Field label="Doc code" value={form.docCode} onChange={(v) => setField("docCode", v)} />
              <Field label="Name" value={form.name} onChange={(v) => setField("name", v)} />
              <Field label="Category" value={form.category} onChange={(v) => setField("category", v)} />
              <Field label="Source / owner" value={form.sourceOwner} onChange={(v) => setField("sourceOwner", v)} />
              <Area label="Typically required for" value={form.typicallyRequiredFor} onChange={(v) => setField("typicallyRequiredFor", v)} />
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <Label>Track expiry</Label>
                <Switch checked={!!form.expiryTracked} onCheckedChange={(v) => setField("expiryTracked", v)} />
              </div>
            </>
          )}
          {tab === "scopeTags" && (
            <>
              <Field label="Code" value={form.code} onChange={(v) => setField("code", v)} />
              <Field label="Name" value={form.name} onChange={(v) => setField("name", v)} />
              <Area label="Description" value={form.description} onChange={(v) => setField("description", v)} />
              <CheckList
                label="Triggers these permits"
                hint="Permits that apply when work items carry this tag. Editing here updates the same mapping as the permit catalogue."
                items={permits}
                selectedIds={form.permitTypeIds || []}
                idKey="id"
                primary={(p) => p.name}
                secondary={(p) => p.permitCode}
                description={(p) => {
                  const link = (form.triggeredPermits || []).find((x) => x.id === p.id);
                  if (!link?.createdByName) return p.typicalTrigger;
                  return `${p.typicalTrigger || ""} Set by ${link.createdByName}.`.trim();
                }}
                onToggle={(id, checked) => toggleId("permitTypeIds", id, checked)}
                empty="No permit types yet."
              />
            </>
          )}
          {tab === "propertyTypes" && (
            <>
              <Field label="Code" value={form.code} onChange={(v) => setField("code", v)} />
              <Field label="Name" value={form.name} onChange={(v) => setField("name", v)} />
              <Area label="Description" value={form.description} onChange={(v) => setField("description", v)} />
            </>
          )}
          {tab === "projectNatures" && (
            <>
              <Field label="Code" value={form.code} onChange={(v) => setField("code", v)} />
              <Field label="Name" value={form.name} onChange={(v) => setField("name", v)} />
              <Area label="Description" value={form.description} onChange={(v) => setField("description", v)} />
            </>
          )}
          {tab === "registrations" && (
            <>
              <SelectField
                label="Authority"
                value={form.authorityId || ""}
                onChange={(v) => setField("authorityId", v)}
                options={authorities.map((a) => ({ value: a.id, label: `${a.code} — ${a.name}` }))}
              />
              <Field label="Registration / reference no." value={form.referenceNo} onChange={(v) => setField("referenceNo", v)} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Registration date" value={form.registrationDate} onChange={(v) => setField("registrationDate", v)} type="date" />
                <Field label="Renewal date" value={form.renewalDate} onChange={(v) => setField("renewalDate", v)} type="date" />
              </div>
              <SelectField
                label="Status"
                value={form.status || "Active"}
                onChange={(v) => setField("status", v)}
                options={REGISTRATION_STATUSES}
              />
              <Area label="Notes" value={form.notes} onChange={(v) => setField("notes", v)} />
            </>
          )}
          {tab === "packs" && (
            <>
              <Field label="Code" value={form.code} onChange={(v) => setField("code", v)} />
              <Field label="Name" value={form.name} onChange={(v) => setField("name", v)} />
              <Area label="Description" value={form.description} onChange={(v) => setField("description", v)} />
              <SelectField
                label="Community / OA authority"
                value={form.communityAuthorityId || "__none"}
                onChange={(v) => setField("communityAuthorityId", v === "__none" ? "" : v)}
                options={[{ value: "__none", label: "None" }, ...authorities.map((a) => ({ value: a.id, label: `${a.code} — ${a.name}` }))]}
              />
              <SelectField
                label="Primary planning authority"
                value={form.primaryAuthorityId || "__none"}
                onChange={(v) => setField("primaryAuthorityId", v === "__none" ? "" : v)}
                options={[{ value: "__none", label: "None" }, ...authorities.map((a) => ({ value: a.id, label: `${a.code} — ${a.name}` }))]}
              />
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <Label>Show on project create</Label>
                <Switch checked={form.selectable !== false} onCheckedChange={(v) => setField("selectable", v)} />
              </div>
            </>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </div>
      </MasterFormModal>

      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete this record?"
        description="It will be hidden from the catalog. Existing project cases are not deleted."
      />
    </ConfigurationLayout>
  );
}

function TagList({ items, empty }) {
  if (!items?.length) {
    return <span className="text-xs text-muted-foreground">{empty}</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <Badge key={item} variant="outline" className="text-[10px] font-normal">{item}</Badge>
      ))}
    </div>
  );
}

function CheckList({ label, hint, items, selectedIds, idKey, primary, secondary, description, onToggle, empty }) {
  return (
    <div className="space-y-2 p-3 border rounded-lg">
      <Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">{label}</Label>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      <div className="max-h-[180px] overflow-y-auto border rounded-md p-2 space-y-1">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground p-2">{empty}</p>
        ) : (
          items.map((item) => {
            const id = item[idKey];
            const checked = (selectedIds || []).includes(id);
            return (
              <div key={id} className="flex items-start gap-2 p-2 rounded hover:bg-muted/30">
                <Checkbox
                  id={`check-${label}-${id}`}
                  checked={checked}
                  onCheckedChange={(c) => onToggle(id, !!c)}
                />
                <label htmlFor={`check-${label}-${id}`} className="text-xs cursor-pointer flex-1">
                  <span className="font-medium">{primary(item)}</span>
                  {secondary && (
                    <span className="font-mono text-muted-foreground ml-1">({secondary(item)})</span>
                  )}
                  {description?.(item) && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{description(item)}</p>
                  )}
                </label>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input className="h-9" type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Area({ label, value, onChange }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Textarea rows={3} value={value || ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((opt) =>
            typeof opt === "string" ? (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ) : (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            )
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
