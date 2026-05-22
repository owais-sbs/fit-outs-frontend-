import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Filter, UserPlus, Briefcase, DollarSign, CheckCircle, MessageSquare, TrendingUp } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import StatCard from "@/modules/super-admin/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import ReadyForConversionTable from "../components/client-conversion/ReadyForConversionTable";
import ClientConversionForm from "../components/client-conversion/ClientConversionForm";
import ProposalSummaryCard from "../components/client-conversion/ProposalSummaryCard";
import PaymentSummaryCard from "../components/client-conversion/PaymentSummaryCard";
import ClientInfoCard from "../components/client-conversion/ClientInfoCard";
import ConversionTimeline from "../components/client-conversion/ConversionTimeline";
import SiteVisitSummaryCard from "../components/client-conversion/SiteVisitSummaryCard";
import NegotiationSummaryCard from "../components/client-conversion/NegotiationSummaryCard";
import ConversionSuccessModal from "../components/client-conversion/ConversionSuccessModal";
import useClientConversion from "../hooks/useClientConversion";

function formatCurrency(n) {
  return n ? `$${n.toLocaleString()}` : "$0";
}

function formatDate(d) {
  if (!d) return "\u2014";
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

export default function ClientConversionPage() {
  const navigate = useNavigate();
  const {
    leads, recent, loading, selectedLead, setSelectedLead,
    result, successOpen, setSuccessOpen,
    search, setSearch, typeFilter, setTypeFilter,
    managerFilter, setManagerFilter, filteredLeads,
    handleConvert, loadData,
  } = useClientConversion();

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = [
    { title: "Ready for Conversion", value: leads.length, icon: UserPlus, growth: 15, growthLabel: "vs last month" },
    { title: "Converted This Month", value: 2, icon: CheckCircle, growth: 25, growthLabel: "vs last month" },
    { title: "Pending Payments", value: leads.filter((l) => l.paymentStatus !== "Paid").length, icon: DollarSign, growth: -10, growthLabel: "vs last month" },
    { title: "Approved Proposals", value: leads.filter((l) => l.proposalStatus === "Approved").length, icon: Briefcase, growth: 12, growthLabel: "vs last month" },
    { title: "Active Negotiations", value: 0, icon: MessageSquare, growth: 0, growthLabel: "vs last month" },
    { title: "Total Converted Revenue", value: formatCurrency(recent.reduce((s, r) => s + r.revenue, 0)), icon: TrendingUp, growth: 18, growthLabel: "vs last month" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Conversion"
        description="Convert approved CRM leads into active clients and projects."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Convert Client
            </Button>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {stats.map((s) => (
          <StatCard key={s.title} title={s.title} value={s.value} icon={s.icon} growth={s.growth} growthLabel={s.growthLabel} />
        ))}
      </section>

      {/* Lead Selection + Conversion Form */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Select Lead for Conversion</h3>
        <ReadyForConversionTable
          leads={filteredLeads}
          loading={loading}
          selectedId={selectedLead?.id}
          onSelect={setSelectedLead}
          search={search}
          onSearchChange={setSearch}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          managerFilter={managerFilter}
          onManagerChange={setManagerFilter}
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left column — form + proposal + payment */}
        <div className="space-y-6 xl:col-span-2">
          <ClientConversionForm
            selectedLead={selectedLead}
            onSubmit={handleConvert}
            onSaveDraft={() => {}}
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <ProposalSummaryCard lead={selectedLead} />
            <PaymentSummaryCard lead={selectedLead} />
          </div>
        </div>

        {/* Right column — info + timeline + site + negotiation */}
        <div className="space-y-6">
          <ClientInfoCard lead={selectedLead} />
          <ConversionTimeline lead={selectedLead} />
          <SiteVisitSummaryCard lead={selectedLead} />
          <NegotiationSummaryCard lead={selectedLead} />
        </div>
      </div>

      {/* Recent Conversions Table */}
      <Card className="overflow-hidden border-border/60 shadow-sm">
        <CardHeader className="border-b border-border/60 pb-3">
          <CardTitle className="text-base">Recent Conversions</CardTitle>
        </CardHeader>
        <div className="overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Client ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Converted Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full max-w-[100px]" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : recent.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center">
                        <p className="text-sm text-muted-foreground">No conversions yet this period.</p>
                      </TableCell>
                    </TableRow>
                  )
                  : recent.map((c) => (
                    <TableRow key={c.id} className="cursor-pointer">
                      <TableCell className="pl-6 font-mono text-xs text-muted-foreground">{c.id}</TableCell>
                      <TableCell className="font-medium">{c.clientName}</TableCell>
                      <TableCell className="text-muted-foreground">{c.project}</TableCell>
                      <TableCell>{c.manager}</TableCell>
                      <TableCell className="tabular-nums font-medium">{formatCurrency(c.revenue)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(c.convertedDate)}</TableCell>
                      <TableCell>
                        <Badge variant={c.status === "Active" ? "default" : "success"}>{c.status}</Badge>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(ROUTES.ADMIN.CLIENT_DETAIL.replace(":clientId", c.id))}>
                              View Client
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(ROUTES.ADMIN.PROJECTS)}>
                              Open Project
                            </DropdownMenuItem>
                            <DropdownMenuItem>View Payments</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <ConversionSuccessModal
        open={successOpen}
        onOpenChange={setSuccessOpen}
        result={result}
        onViewProject={() => { setSuccessOpen(false); navigate(ROUTES.ADMIN.PROJECTS); }}
        onViewClient={() => { setSuccessOpen(false); }}
        onGoToProjects={() => { setSuccessOpen(false); navigate(ROUTES.ADMIN.PROJECTS); }}
      />
    </div>
  );
}
