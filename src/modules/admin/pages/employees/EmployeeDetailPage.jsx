import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Briefcase, Calendar, CheckCircle2,
  KeyRound, Mail, MapPin, Phone, Shield, User, X, XCircle,
} from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { fetchEmployeeById } from "../../api/employees.api";
import { EMPLOYEE_PROJECTS, EMPLOYEE_ROLES } from "../../data/employees";
import { ROUTES } from "@/shared/constants/routes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_VARIANT = { active: "success", inactive: "secondary", suspended: "destructive" };

const AVATAR_COLORS = [
  { bg: "bg-violet-500", hex: "7C3AED" },
  { bg: "bg-sky-500",    hex: "0284C7" },
  { bg: "bg-emerald-600",hex: "059669" },
  { bg: "bg-amber-500",  hex: "B45309" },
  { bg: "bg-rose-500",   hex: "BE123C" },
  { bg: "bg-indigo-600", hex: "4338CA" },
  { bg: "bg-teal-600",   hex: "0F766E" },
  { bg: "bg-orange-500", hex: "C2410C" },
];

function avatarPalette(name = "") {
  const n = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function avatarUrl(name = "") {
  const p = avatarPalette(name);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${p.hex}&color=ffffff&size=128&bold=true&format=svg`;
}

function initials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Info row ─────────────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div className="flex items-start gap-4 py-2.5 border-b border-border/40 last:border-0">
      <span className="w-32 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">{value || "—"}</span>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function DetailSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
      <Card className="border-border/60">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="mx-auto h-24 w-24 rounded-full" />
          <Skeleton className="h-5 w-36 mx-auto" />
          <Skeleton className="h-4 w-28 mx-auto" />
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-3 w-full" />)}
        </CardContent>
      </Card>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
      </div>
    </div>
  );
}

// ─── TAB 1: Overview ─────────────────────────────────────────────────────────
function OverviewTab({ emp }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Personal */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-1 pt-5 px-5">
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <InfoRow label="Full Name"  value={emp.fullName} />
          <InfoRow label="Gender"     value={emp.gender} />
          <InfoRow label="Birthday"   value={fmtDate(emp.dateOfBirth)} />
          <InfoRow label="Email"      value={emp.email} />
          <InfoRow label="Phone"      value={emp.phone} />
          <InfoRow label="Emergency"  value={emp.emergencyContact} />
          <InfoRow
            label="Address"
            value={[emp.address, emp.city, emp.state, emp.zipCode].filter(Boolean).join(", ")}
          />
          <InfoRow label="Country" value={emp.country} />
        </CardContent>
      </Card>

      {/* Employment */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-1 pt-5 px-5">
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Employment Information
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <InfoRow label="Employee ID"  value={emp.employeeId} />
          <InfoRow label="Joined"       value={fmtDate(emp.joiningDate)} />
          <InfoRow label="Department"   value={emp.department} />
          <InfoRow label="Designation"  value={emp.designation} />
          <InfoRow label="Type"         value={emp.employmentType} />
          <InfoRow label="Reports To"   value={emp.reportingManager} />
          <InfoRow label="Username"     value={emp.username} />
          {/* Roles inline */}
          <div className="flex items-start gap-4 pt-2.5">
            <span className="w-32 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Roles
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(emp.roles || []).map((r) => (
                <span
                  key={r}
                  className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/8 px-2.5 py-0.5 text-xs font-medium text-primary"
                >
                  <Shield className="h-2.5 w-2.5" />
                  {r}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── TAB 2: Roles ─────────────────────────────────────────────────────────────
function RolesTab({ emp, onRolesChange }) {
  const [roles, setRoles] = useState(emp.roles || []);
  const [changed, setChanged] = useState(false);

  const toggle = (role) => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
    setChanged(true);
  };

  const save = () => { onRolesChange(roles); setChanged(false); };
  const reset = () => { setRoles(emp.roles || []); setChanged(false); };

  const roleGroups = [
    { label: "Administration",  roles: ["Super Admin", "Admin"] },
    { label: "Engineering",     roles: ["Civil Engineer", "Site Engineer", "QA Inspector"] },
    { label: "Design & PM",     roles: ["Architect", "Designer", "Project Manager"] },
    { label: "Business",        roles: ["Sales Executive", "Accountant", "HR"] },
    { label: "General",         roles: ["Employee", "Viewer"] },
  ];

  return (
    <div className="space-y-5">
      {/* Header + save bar */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-semibold">Role Management</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {emp.fullName} · {roles.length} role{roles.length !== 1 ? "s" : ""} assigned.
                Click any role chip to assign or remove it.
              </CardDescription>
            </div>
            {changed && (
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" onClick={reset}>Discard</Button>
                <Button size="sm" onClick={save}>Save Changes</Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Active roles — removable pills */}
          <div>
            <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Currently Assigned
            </p>
            {roles.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No roles assigned yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => (
                  <span
                    key={r}
                    className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 pl-3 pr-2 py-1 text-xs font-semibold text-primary"
                  >
                    <Shield className="h-3 w-3" />
                    {r}
                    <button
                      type="button"
                      onClick={() => toggle(r)}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
                      aria-label={`Remove ${r}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Role groups grid */}
          <div className="space-y-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Available Roles — click to assign / remove
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {roleGroups.map((group) => (
                <div key={group.label}>
                  <p className="mb-2 text-[11px] font-semibold text-muted-foreground">{group.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.roles.map((role) => {
                      const active = roles.includes(role);
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => toggle(role)}
                          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                            active
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : "border-border/50 bg-card text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                          }`}
                        >
                          {active && <CheckCircle2 className="h-3 w-3" />}
                          {role}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role history */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Role Change History
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {(emp.activityLogs || []).filter((l) => l.type === "role").length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No role changes on record.</p>
          ) : (
            <div className="space-y-2">
              {(emp.activityLogs || [])
                .filter((l) => l.type === "role")
                .map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between gap-4 rounded-lg bg-muted/30 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
                      <p className="text-sm truncate">{log.action}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-medium text-muted-foreground">{log.date}</p>
                      <p className="text-[11px] text-muted-foreground">by {log.performedBy}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── TAB 3: Projects ──────────────────────────────────────────────────────────
function ProjectsTab({ emp }) {
  const projects = EMPLOYEE_PROJECTS.filter((p) => (emp.assignedProjects || []).includes(p.id));

  if (projects.length === 0) {
    return (
      <Card className="border-border/60">
        <CardContent className="py-20 text-center">
          <Briefcase className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm font-medium">No projects assigned</p>
          <p className="text-xs text-muted-foreground mt-1">Projects assigned to this employee will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-5">Project</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Manager</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assigned</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((p) => (
            <TableRow key={p.id} className="hover:bg-muted/20">
              <TableCell className="pl-5 font-medium">{p.name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{p.location}</TableCell>
              <TableCell className="text-sm">{p.manager}</TableCell>
              <TableCell className="text-sm font-medium">{p.budget || "—"}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    p.status === "Completed" ? "success" :
                    p.status === "Planning" ? "secondary" : "warning"
                  }
                >
                  {p.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{fmtDate(p.assignedDate)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function EmployeeDetailPage() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "overview";

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchEmployeeById(employeeId)
      .then((data) => { if (!cancelled) setEmployee(data); })
      .catch((err) => { if (!cancelled) console.error(err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [employeeId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-52" />
        <DetailSkeleton />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate(ROUTES.ADMIN.EMPLOYEES)}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Card className="border-border/60">
          <CardContent className="py-24 text-center">
            <User className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="font-medium">Employee not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={employee.fullName}
        description={`${employee.designation} · ${employee.department}`}
        actions={
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate(ROUTES.ADMIN.EMPLOYEES)}>
            <ArrowLeft className="h-4 w-4" />
            All Employees
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        {/* ── Left: Profile panel ───────────────────────── */}
        <div className="space-y-4">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-6">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3 pb-5">
                <Avatar className="h-24 w-24 ring-4 ring-border/40 ring-offset-2 ring-offset-background">
                  <AvatarImage
                    src={employee.avatar || avatarUrl(employee.fullName)}
                    alt={employee.fullName}
                  />
                  <AvatarFallback className={`text-2xl font-bold ${avatarPalette(employee.fullName).bg} text-white`}>
                    {initials(employee.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h2 className="text-lg font-bold leading-tight">{employee.fullName}</h2>
                  <p className="text-sm text-muted-foreground">{employee.designation}</p>
                  <p className="text-xs text-muted-foreground">{employee.department}</p>
                </div>
                <Badge variant={STATUS_VARIANT[employee.status]} className="capitalize px-3">
                  {employee.status}
                </Badge>
              </div>

              <Separator className="mb-4" />

              {/* Contact */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-xs text-muted-foreground">{employee.email}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{employee.phone}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Joined {fmtDate(employee.joiningDate)}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {[employee.city, employee.state].filter(Boolean).join(", ") || "—"}
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Shield className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {(employee.roles || []).map((r) => (
                      <span
                        key={r}
                        className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Quick info chips */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-muted/40 p-2.5">
                  <p className="text-lg font-bold">{(employee.assignedProjects || []).length}</p>
                  <p className="text-[10px] text-muted-foreground">Projects</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2.5">
                  <p className="text-lg font-bold">{(employee.roles || []).length}</p>
                  <p className="text-[10px] text-muted-foreground">Roles</p>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Actions */}
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full gap-2 justify-start">
                  <User className="h-3.5 w-3.5" />
                  Edit Profile
                </Button>
                <Button variant="outline" size="sm" className="w-full gap-2 justify-start">
                  <KeyRound className="h-3.5 w-3.5" />
                  Reset Password
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 justify-start text-destructive hover:text-destructive"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  {employee.status === "active" ? "Deactivate Account" : "Activate Account"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Employment type tag */}
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Employment</span>
                <Badge variant="outline" className="text-xs">{employee.employmentType}</Badge>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Reports To</span>
                <span className="text-xs font-medium">{employee.reportingManager || "—"}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Employee ID</span>
                <span className="text-xs font-mono text-muted-foreground">{employee.employeeId}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Tabs ───────────────────────────────── */}
        <Tabs defaultValue={defaultTab}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="role">Roles</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
          </TabsList>

          <div className="mt-5">
            <TabsContent value="overview">
              <OverviewTab emp={employee} />
            </TabsContent>
            <TabsContent value="role">
              <RolesTab
                emp={employee}
                onRolesChange={(roles) => setEmployee((e) => ({ ...e, roles }))}
              />
            </TabsContent>
            <TabsContent value="projects">
              <ProjectsTab emp={employee} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
