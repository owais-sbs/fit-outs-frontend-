import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Mail, Phone, Shield, User,
} from "lucide-react";
import { fetchEmployeeById } from "../../api/employees.api";
import { ROUTES } from "@/shared/constants/routes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const AVATAR_COLORS = [
  { bg: "bg-violet-500", hex: "7C3AED" },
  { bg: "bg-sky-500",    hex: "0284C7" },
  { bg: "bg-emerald-600",hex: "059669" },
  { bg: "bg-amber-500",  hex: "B45309" },
  { bg: "bg-rose-500",   hex: "BE123C" },
];

function avatarColor(name = "") {
  const code = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function initials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function EmployeeDetailPage() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchEmployeeById(employeeId)
      .then((data) => { if (!cancelled) setEmployee(data); })
      .catch(() => { if (!cancelled) setEmployee(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [employeeId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.ADMIN.EMPLOYEES)}>
          <ArrowLeft className="mr-2 h-4 w-4" />Back
        </Button>
        <Card><CardContent className="py-16"><Skeleton className="h-8 w-48 mx-auto" /></CardContent></Card>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.ADMIN.EMPLOYEES)}>
          <ArrowLeft className="mr-2 h-4 w-4" />Back
        </Button>
        <Card><CardContent className="py-16 text-center text-muted-foreground">Employee not found.</CardContent></Card>
      </div>
    );
  }

  const color = avatarColor(employee.employeeName);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.ADMIN.EMPLOYEES)} className="-ml-2">
        <ArrowLeft className="mr-2 h-4 w-4" />Employees
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 text-lg">
            <AvatarFallback className={`${color.bg} text-white font-bold`}>
              {initials(employee.employeeName)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h1 className="text-xl font-bold">{employee.employeeName}</h1>
            <p className="text-sm text-muted-foreground">{employee.designation}</p>
            <div className="flex items-center gap-1.5 pt-0.5">
              <Badge variant={employee.isActive ? "success" : "secondary"}>
                {employee.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{employee.email}</p>
              </div>
            </div>
            {employee.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">{employee.phone}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Feature Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            {employee.features && employee.features.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {employee.features.map((f) => (
                  <span
                    key={f}
                    className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
                  >
                    {f}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No features assigned</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
