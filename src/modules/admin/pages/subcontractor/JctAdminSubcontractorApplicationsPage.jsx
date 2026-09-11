import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Building2, Search, Filter, ShieldCheck, ArrowRight, Clock, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageShell, PageTitle, SearchInput, FilterToolbar } from "@/components/layout/PageShell";
import { getStoredApplications } from "@/modules/subcontractor/mock/subcontractorOnboardingMock";

export default function JctAdminSubcontractorApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setApplications(getStoredApplications());
  }, []);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Tab Filter
      if (activeTab !== "ALL" && app.status !== activeTab) {
        return false;
      }
      // Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = app.legalName.toLowerCase().includes(q) || (app.tradeName && app.tradeName.toLowerCase().includes(q));
        const matchCr = app.crNumber.toLowerCase().includes(q);
        const matchEmail = app.contactEmail.toLowerCase().includes(q);
        return matchName || matchCr || matchEmail;
      }
      return true;
    });
  }, [applications, activeTab, searchQuery]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "VERIFIED":
        return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs">Verified</Badge>;
      case "REJECTED":
        return <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 text-xs">Rejected</Badge>;
      case "REGISTERED":
        return <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30 text-xs">Registered</Badge>;
      default:
        return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-xs">Under Review</Badge>;
    }
  };

  return (
    <PageShell>
      <PageTitle
        title="Subcontractor Applications"
        subtitle="Review, verify legal documents, and approve trade vendor prequalification applications"
      />

      {/* Filter & Search Toolbar */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-4">
          <FilterToolbar className="justify-between">
            <div className="w-full sm:w-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="h-9 text-xs">
                  <TabsTrigger value="ALL">All ({applications.length})</TabsTrigger>
                  <TabsTrigger value="UNDER_REVIEW">
                    Under Review ({applications.filter((a) => a.status === "UNDER_REVIEW").length})
                  </TabsTrigger>
                  <TabsTrigger value="REGISTERED">
                    Registered ({applications.filter((a) => a.status === "REGISTERED").length})
                  </TabsTrigger>
                  <TabsTrigger value="VERIFIED">
                    Verified ({applications.filter((a) => a.status === "VERIFIED").length})
                  </TabsTrigger>
                  <TabsTrigger value="REJECTED">
                    Rejected ({applications.filter((a) => a.status === "REJECTED").length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <SearchInput
              placeholder="Search by company, CR number, or email…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </FilterToolbar>
        </CardContent>
      </Card>

      {/* Main Applications Table */}
      <Card className="border-border shadow-sm">
        <CardHeader className="p-4 md:p-6 pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Vendor Registration Queue</span>
            <span className="text-xs font-normal text-muted-foreground">Showing {filteredApplications.length} entries</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">Company Name</TableHead>
                  <TableHead className="text-xs">CR Number</TableHead>
                  <TableHead className="text-xs">Trade Specializations</TableHead>
                  <TableHead className="text-xs">Contact Email</TableHead>
                  <TableHead className="text-xs">Reg Date</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {app.legalName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-foreground font-semibold block">{app.legalName}</span>
                          <span className="text-[11px] text-muted-foreground">{app.tradeName || app.legalName}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{app.crNumber}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {(app.tradeSpecializations || []).slice(0, 2).map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px]">
                            {t}
                          </Badge>
                        ))}
                        {(app.tradeSpecializations || []).length > 2 && (
                          <Badge variant="outline" className="text-[10px]">
                            +{(app.tradeSpecializations || []).length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{app.contactEmail}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(app.registeredAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(app.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1 border-border">
                        <Link to={`/admin/subcontractors/applications/${app.id}`}>
                          Review Application <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {filteredApplications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                      No subcontractor applications match the selected filter or search query.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
