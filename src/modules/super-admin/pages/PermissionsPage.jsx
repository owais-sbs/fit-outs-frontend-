import { useMemo, useState } from "react";
import PageHeader from "../components/shared/PageHeader";
import {
  MATRIX_USERS,
  PERMISSION_MODULES,
  PERMISSION_ACTIONS,
  DEFAULT_PERMISSIONS,
} from "../data/permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

export default function PermissionsPage() {
  const [roleFilter, setRoleFilter] = useState("all");
  const [perms, setPerms] = useState(DEFAULT_PERMISSIONS);

  const users = useMemo(
    () =>
      roleFilter === "all"
        ? MATRIX_USERS
        : MATRIX_USERS.filter((u) => u.role === roleFilter),
    [roleFilter]
  );

  const toggle = (userId, moduleId, action) => {
    const key = `${userId}-${moduleId}-${action}`;
    setPerms((p) => ({ ...p, [key]: !p[key] }));
  };

  const grantedCount = Object.values(perms).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permission matrix"
        description="Visual grid for user vs module permissions — view, create, edit, delete, export, manage."
        actions={
          <Button size="sm" onClick={() => setPerms({ ...DEFAULT_PERMISSIONS })}>
            Reset defaults
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="border-border/60 lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-base">Permission grid</CardTitle>
              <CardDescription>Toggle permissions inline — sticky headers on scroll</CardDescription>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Filter role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="Company Admin">Company Admin</SelectItem>
                <SelectItem value="Project Manager">Project Manager</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[calc(100vh-16rem)]">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead className="sticky top-0 z-20 bg-muted/90 backdrop-blur-sm">
                  <tr className="border-b">
                    <th className="sticky left-0 z-30 min-w-[140px] bg-muted/95 p-3 text-left font-medium">User</th>
                    {PERMISSION_MODULES.map((mod) => (
                      <th key={mod.id} colSpan={PERMISSION_ACTIONS.length} className="border-l p-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {mod.label}
                      </th>
                    ))}
                  </tr>
                  <tr className="border-b bg-muted/50">
                    <th className="sticky left-0 z-30 bg-muted/95 p-2" />
                    {PERMISSION_MODULES.map((mod) =>
                      PERMISSION_ACTIONS.map((action) => (
                        <th key={`${mod.id}-${action}`} className="border-l p-1 text-center text-[10px] font-medium capitalize text-muted-foreground">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-default">{action.slice(0, 1)}</span>
                            </TooltipTrigger>
                            <TooltipContent>{action}</TooltipContent>
                          </Tooltip>
                        </th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b transition-colors hover:bg-muted/30">
                      <td className="sticky left-0 z-10 border-r border-border bg-card p-3 font-medium">
                        <p>{user.name}</p>
                        <Badge variant="outline" className="mt-1 text-[10px]">{user.role}</Badge>
                      </td>
                      {PERMISSION_MODULES.map((mod) =>
                        PERMISSION_ACTIONS.map((action) => {
                          const key = `${user.id}-${mod.id}-${action}`;
                          return (
                            <td key={key} className="border-l p-1 text-center">
                              <Switch
                                className="scale-75"
                                checked={!!perms[key]}
                                onCheckedChange={() => toggle(user.id, mod.id, action)}
                              />
                            </td>
                          );
                        })
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="sticky top-20 h-fit border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Users</span><span className="font-medium">{users.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Modules</span><span className="font-medium">{PERMISSION_MODULES.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Granted</span><span className="font-medium text-primary">{grantedCount}</span></div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Changes apply instantly for demo. Production should persist via API.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
