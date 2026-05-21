import { useNavigate } from "react-router-dom";
import { Building2, MoreHorizontal } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_VARIANT = {
  active: "success",
  trial: "warning",
  expired: "destructive",
};

function formatDate(dateStr) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

function getTenantDetailPath(tenantId) {
  return ROUTES.SUPER_ADMIN.TENANT_DETAIL.replace(":tenantId", tenantId);
}

export default function TenantTable({ tenants }) {
  const navigate = useNavigate();

  if (tenants.length === 0) {
    return (
      <Card className="border-border/60 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Building2 className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-lg font-semibold">No tenants found</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Try adjusting your search or filters to find matching tenants.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-0">
        <CardTitle className="text-base font-semibold">
          {tenants.length} tenant{tenants.length !== 1 ? "s" : ""}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 pt-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Tenant</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow
                  key={tenant.id}
                  className="cursor-pointer"
                  onClick={() => navigate(getTenantDetailPath(tenant.id))}>
                  <TableCell className="pl-6 font-medium">{tenant.name}</TableCell>
                  <TableCell>{tenant.plan}</TableCell>
                  <TableCell>{tenant.users}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[tenant.status] || "secondary"}>
                      {tenant.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(tenant.expiryDate)}
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Actions for ${tenant.name}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(getTenantDetailPath(tenant.id));
                          }}>
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          Edit tenant
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => e.stopPropagation()}
                          className="text-destructive focus:text-destructive">
                          Suspend
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
